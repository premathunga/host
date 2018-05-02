// # ----- Script info:
// - Author: Michael Mammoliti
// - Name: jAudio.js
// - Version: 0.2
// - js dipendencies: jQuery
// - Release date: 25 November 2015
// - GitHub: https://github.com/MichaelMammoliti/jAudio.js

// # ----- Contact info
// - GitHub: https://github.com/MichaelMammoliti
// - Mail: mammoliti.michael@gmail.com
// - Twitter: @MichMammoliti

// # ----- License Info
// - Released under the GPL v3 license.

(function($){

  var pluginName = "jAudio",
      defaults = {
        playlist: [],

        defaultAlbum: undefined,
        defaultArtist: undefined,
        defaultTrack: 0,

        autoPlay: false,

        debug: false
      };

  function Plugin( $context, options )
  {
    this.settings         = $.extend( true, defaults, options );

    this.$context         = $context;

    this.domAudio         = this.$context.find("audio")[0];
    this.$domPlaylist     = this.$context.find(".jAudio--playlist");
    this.$domControls     = this.$context.find(".jAudio--controls");
    this.$domVolumeBar    = this.$context.find(".jAudio--volume");
    this.$domDetails      = this.$context.find(".jAudio--details");
    this.$domStatusBar    = this.$context.find(".jAudio--status-bar");
    this.$domProgressBar  = this.$context.find(".jAudio--progress-bar-wrapper");
    this.$domTime         = this.$context.find(".jAudio--time");
    this.$domElapsedTime  = this.$context.find(".jAudio--time-elapsed");
    this.$domTotalTime    = this.$context.find(".jAudio--time-total");
    this.$domThumb        = this.$context.find(".jAudio--thumb");

    this.currentState       = "pause";
    this.currentTrack       = this.settings.defaultTrack;
    this.currentElapsedTime = undefined;

    this.timer              = undefined;

    this.init();
  }

  Plugin.prototype = {

    init: function()
    {
      var self = this;

      self.renderPlaylist();
      self.preLoadTrack();
      self.highlightTrack();
      self.updateTotalTime();
      self.events();
      self.debug();
      self.domAudio.volume = 1.0
    },

    play: function()
    {
      var self        = this,
          playButton  = self.$domControls.find("#btn-play");

      self.domAudio.play();

      if(self.currentState === "play") return;

      clearInterval(self.timer);
      self.timer = setInterval( self.run.bind(self), 50 );

      self.currentState = "play";

      // change id
      playButton.data("action", "pause");
      playButton.attr("id", "btn-pause");

      // activate
      playButton.toggleClass('active');
    },

    pause: function()
    {
      var self        = this,
          playButton  = self.$domControls.find("#btn-pause");

      self.domAudio.pause();
      clearInterval(self.timer);

      self.currentState = "pause";

      // change id
      playButton.data("action", "play");
      playButton.attr("id", "btn-play");

      // activate
      playButton.toggleClass('active');

    },

    stop: function()
    {
      var self = this;

      self.domAudio.pause();
      self.domAudio.currentTime = 0;

      self.animateProgressBarPosition();
      clearInterval(self.timer);
      self.updateElapsedTime();

      self.currentState = "stop";
    },

    prev: function()
    {
      var self  = this,
          track;

      (self.currentTrack === 0)
        ? track = self.settings.playlist.length - 1
        : track = self.currentTrack - 1;

      self.changeTrack(track);
    },
    next: function()
    {
      var self = this,
          track;

      (self.currentTrack === self.settings.playlist.length - 1)
        ? track = 0
        : track = self.currentTrack + 1;

      self.changeTrack(track);
    },


    preLoadTrack: function()
    {
      var self      = this,
          defTrack  = self.settings.defaultTrack;

      self.changeTrack( defTrack );

      self.stop();
    },

    changeTrack: function(index)
    {
      var self = this;

      self.currentTrack  = index;
      self.domAudio.src  = self.settings.playlist[index].file;

      if(self.currentState === "play" || self.settings.autoPlay) self.play();

      self.highlightTrack();

      self.updateThumb();

      self.renderDetails();
    },

    events: function()
    {
      var self = this;

      // - controls events
      self.$domControls.on("click", "button", function()
      {
        var action = $(this).data("action");

        switch( action )
        {
          case "prev": self.prev.call(self); break;
          case "next": self.next.call(self); break;
          case "pause": self.pause.call(self); break;
          case "stop": self.stop.call(self); break;
          case "play": self.play.call(self); break;
        };

      });

      // - playlist events
      self.$domPlaylist.on("click", ".jAudio--playlist-item", function(e)
      {
        var item = $(this),
            track = item.data("track"),
            index = item.index();

        if(self.currentTrack === index) return;

        self.changeTrack(index);
      });

      // - volume's bar events
      // to do

      // - progress bar events
      self.$domProgressBar.on("click", function(e)
      {
        self.updateProgressBar(e);
        self.updateElapsedTime();
      });

      $(self.domAudio).on("loadedmetadata", function()
      {
        self.animateProgressBarPosition.call(self);
        self.updateElapsedTime.call(self);
        self.updateTotalTime.call(self);
      });
    },


    getAudioSeconds: function(string)
    {
      var self    = this,
          string  = string % 60;
          string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    getAudioMinutes: function(string)
    {
      var self    = this,
          string  = string / 60;
          string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    addZero: function(word, howManyZero)
    {
      var word = String(word);

      while(word.length < howManyZero) word = "0" + word;

      return word;
    },

    removeZero: function(word, howManyZero)
    {
      var word  = String(word),
          i     = 0;

      while(i < howManyZero)
      {
        if(word[0] === "0") { word = word.substr(1, word.length); } else { break; }

        i++;
      }

      return word;
    },


    highlightTrack: function()
    {
      var self      = this,
          tracks    = self.$domPlaylist.children(),
          className = "active";

      tracks.removeClass(className);
      tracks.eq(self.currentTrack).addClass(className);
    },

    renderDetails: function()
    {
      var self          = this,
          track         = self.settings.playlist[self.currentTrack],
          file          = track.file,
          thumb         = track.thumb,
          trackName     = track.trackName,
          trackArtist   = track.trackArtist,
          trackAlbum    = track.trackAlbum,
          template      =  "";

          template += "<p>";
          template += "<span>" + trackName + "</span>";
          // template += " - ";
          template += "<span>" + trackArtist + "</span>";
          // template += "<span>" + trackAlbum + "</span>";
          template += "</p>";


      $(".jAudio--details").html(template);

    },

    renderPlaylist: function()
    {
      var self = this,
          template = "";


      $.each(self.settings.playlist, function(i, a)
      {
        var file          = a["file"],
            thumb         = a["thumb"],
            trackName     = a["trackName"],
            trackArtist   = a["trackArtist"],
            trackAlbum    = a["trackAlbum"];
            trackDuration = "00:00";

        template += "<div class='jAudio--playlist-item' data-track='" + file + "'>";

        template += "<div class='jAudio--playlist-thumb'><img src='"+ thumb +"'></div>";

        template += "<div class='jAudio--playlist-meta-text'>";
        template += "<h4>" + trackName + "</h4>";
        template += "<p>" + trackArtist + "</p>";
        template += "</div>";
        // template += "<div class='jAudio--playlist-track-duration'>" + trackDuration + "</div>";
        template += "</div>";

      // });

      });

      self.$domPlaylist.html(template);

    },

    run: function()
    {
      var self = this;

      self.animateProgressBarPosition();
      self.updateElapsedTime();

      if(self.domAudio.ended) self.next();
    },

    animateProgressBarPosition: function()
    {
      var self        = this,
          percentage  = (self.domAudio.currentTime * 100 / self.domAudio.duration) + "%",
          styles      = { "width": percentage };

      self.$domProgressBar.children().eq(0).css(styles);
    },

    updateProgressBar: function(e)
    {
      var self = this,
          mouseX,
          percentage,
          newTime;

      if(e.offsetX) mouseX = e.offsetX;
      if(mouseX === undefined && e.layerX) mouseX = e.layerX;

      percentage  = mouseX / self.$domProgressBar.width();
      newTime     = self.domAudio.duration * percentage;

      self.domAudio.currentTime = newTime;
      self.animateProgressBarPosition();
    },

    updateElapsedTime: function()
    {
      var self      = this,
          time      = self.domAudio.currentTime,
          minutes   = self.getAudioMinutes(time),
          seconds   = self.getAudioSeconds(time),

          audioTime = minutes + ":" + seconds;

      self.$domElapsedTime.text( audioTime );
    },

    updateTotalTime: function()
    {
      var self      = this,
          time      = self.domAudio.duration,
          minutes   = self.getAudioMinutes(time),
          seconds   = self.getAudioSeconds(time),
          audioTime = minutes + ":" + seconds;

      self.$domTotalTime.text( audioTime );
    },


    updateThumb: function()
    {
      var self = this,
          thumb = self.settings.playlist[self.currentTrack].thumb,
          styles = {
            "background-image": "url(" + thumb + ")"
          };

      self.$domThumb.css(styles);
    },

    debug: function()
    {
      var self = this;

      if(self.settings.debug) console.log(self.settings);
    }

  }

  $.fn[pluginName] = function( options )
  {
    var instantiate = function()
    {
      return new Plugin( $(this), options );
    }

    $(this).each(instantiate);
  }

})(jQuery)

var t = {
  playlist: [
   {
      file: " https://docs.google.com/uc?export=download&id=16-AUJk2wiy0kPA_TQyUGOt7SOHsu40_B ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Adaraya Sundara Waradaki  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1raF4mZcozzDWpigNUJE1AiFUUPFDQeaL ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Best Mashups-Jukebox 2  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=13dD1URNxpJAYiFvLPy24TLTne88bNHZg ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Best Mashups-Jukebox  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1ovPHNHosv7-DxXfRjud5zV8IFvAZuW3y ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Hindi Mashup Cover  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=10C2PCq_NFu23lEm_D8mSkMWdDlNsgmQl ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Kisi Se Pyar Ho Jaye Mix Cover  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1RAPCbudoKMFjnNaurPDutMrOm6unieAp ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 6  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=17KdskJ4Kauz3ef0AmBdmwgMF2d8Ebtf1 ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 7  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1IK_dEc_nZNQnRdcl-tnN-vL3j5_0tnS- ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 8  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1eQORpe76fAYaiTHK0rCaxzDjB0zHIFlx ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 9  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1CNyz9HMzdOxnoe8V-hxY3nFjdbiZwqKM ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 10 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1OHcZmW_14lh9YmiSZL13GQclXO0hpnFP ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 11   ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1nd-pZUhbcoFbN7TA4saB2pIHpYSTprhy ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 12   ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=14uaVOSt2gL3yKRhrZGmm9_FKv3Yog4jN ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 13 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1JAvX8dCokil1A7Hp6lsVJ1_IgJcwRsJZ ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 14 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1dK0RMO8vZxjEgOHEAP1mMFlLQccIcGEo ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 17 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1XqrHoIyyz9rAX2y5inyyH0Rr9g76Gdkl ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 18 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1YM-gIjoFXQSULL-Jg8akP4lmMHd415xY ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup cover 20 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1e03-_D6V5kMaMk4czMKp4j48bAMs5FOF ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Mashup Cover 21 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1-8oJGm7s_kEJHVH00Llyi-79Nn1AnZXW ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Rewatunu tharam ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1XqrHoIyyz9rAX2y5inyyH0Rr9g76Gdkl ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Sansaraye Pura  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1CWtcyDvuV-0p_8nZvnkPCBNDB9uw6LN_ ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Sinhala Mashup Cover 3  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1Ap-6t-AaWgptz3k9Kue5nv-UK1Wz8_0n ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Sinhala mashup cover 5  ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1fFe2fT96x52v-eXzJF9fDUhVo5hmtquS ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  Sinhala Mashup Cover(BoyzLoveNoize) ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1xOfMhQbpotg4bleCoZFhiDP6jxotgLW2 ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  SinhalaHindi Mashup 2   ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1HtxKechdYyq7zs12bvrLqjoBbgTGCrrr ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  SinhalaHindi Mashup Cover 4 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1NWiaoe85H1byr1fQPncP7yHQlgrjdn7C ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  SinhalaHindi Mashup Cover 5 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    },
{
      file: " https://docs.google.com/uc?export=download&id=1RKw1n0nDzMBjIIsAj5LyYin2uS_LrwUp ",
      thumb: "  resources/thumbs/cover.png  ",
      trackName: "  SinhalaHindi Mashup Cover 3 ",
      trackArtist: "  Dileepa Saranga ",
      trackAlbum: "Mashup",
    }
  ]
}

$(".jAudio--player").jAudio(t);