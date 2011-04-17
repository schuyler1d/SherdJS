///clipform-display
///1. update noteform field: DjangoSherd_UpdateHack()
///2. initialize clipform field vals
///3. onchange of text fields in clipform to run: DjangoSherd_UpdateHack
///4. on tab-change, set startTime (and from that run DjangoSherd_UpdateHack)

// Listens for:
// Nothing
// 
// Signals:
// clipstart - the clip start time has changed. signals self.targetview.media
// clipend -- the clip end time has changed. signals self.targetview.media



if (!Sherd) {Sherd = {};}
if (!Sherd.Video) {Sherd.Video = {};}
if (!Sherd.Video.Annotators) {Sherd.Video.Annotators= {};}
if (!Sherd.Video.Annotators.ClipForm) {
 Sherd.Video.Annotators.ClipForm = function() {
    var secondsToCode = Sherd.Video.secondsToCode; // @todo -- consider moving these functions out of Video  
    var codeToSeconds = Sherd.Video.codeToSeconds; // and into a separate Utilities or Helpers file?
    
    var self = this;
    Sherd.Base.AssetView.apply(this, arguments);// inherit
    
    this.attachView = function(view) {
        this.targetview = view;
    };
    
    this.targetstorage = [];
    this.addStorage = function(stor) {
        this.targetstorage.push(stor);
    };

    // @todo -- this getState is what is used for storing
    // all the data about the video. would be better if
    // it were a compilation of information from both clipform & player itself
    // eg. duration & timescale aren't clipform properties
    this.getState = function() {
        var duration = self.targetview.media.duration();
        var timeScale = self.targetview.media.timescale();
        
        var obj = {
            'startCode' : self.components.startField.value,
            'endCode' : self.components.endField.value,
            'duration' : duration,
            'timeScale' : timeScale,
            'start' : codeToSeconds(self.components.startField.value),
            'end' : codeToSeconds(self.components.endField.value)
        };
       
        return obj;
    };

    this.setState = function(obj) {
        if (typeof obj == 'object') {
            var start;
            if (obj.startCode) {
                start = obj.startCode;
            } else if (obj.start) {
                start = secondsToCode(obj.start);
            }
            
            var end;
            if (obj.endCode) {
                end = obj.endCode;
            } else if (obj.end) {
                end = secondsToCode(obj.end);
            } else if (start) {
                end = start;
            }
            ///Used to communicate with the clipstrip
            if (start !== undefined) {
                if (self.components.startField)
                    self.components.startField.value = start;
                self.components.start = start;
                self.events.signal(self.targetview, 'clipstart', { start: codeToSeconds(start) });    
            }
            if (end !== undefined) {
                if (self.components.endField)  
                    self.components.endField.value = end; 
                self.components.end = end;
                self.events.signal(self.targetview, 'clipend', { end: codeToSeconds(end) });
            }
        }
    };

    this.storage = {
        update : function(obj, just_downstream) {
            if (!just_downstream) {
                self.setState(obj);
            }
            if (self.targetstorage) {
                for ( var i = 0; i < self.targetstorage.length; i++) {
                    self.targetstorage[i].storage.update(obj);
                }
            }
        }
    };

    this.initialize = function(create_obj) {
        self.events.connect(self.components.startButton, 'click', function(evt) {
            var movieTime = self.targetview.media.time();
            var movieTimeCode = secondsToCode(movieTime);
            self.components.startField.value = movieTimeCode; // update start time with movie time
                
            if (movieTime > codeToSeconds(self.components.endField.value)) {
                // update end time if start time is greater
                self.components.endField.value = movieTimeCode; 
            }
            self.storage.update(self.getState(), false);
        });
        self.events.connect(self.components.endButton, 'click', function(evt) {
                if (self.targetview.media.pause) {
                    ///due to overwhelming user feedback for it to pause on clicking end-button
                    self.targetview.media.pause();
                }

                var movieTime = self.targetview.media.time();
                var movieTimeCode = secondsToCode(movieTime);
            
                self.components.endField.value = movieTimeCode; // update the end time with movie time
                
                // if the start time is greater then the endtime, make start time match end time
                if (movieTime < codeToSeconds(self.components.startField.value)) 
                    self.components.startField.value = movieTimeCode;
                
                self.storage.update(self.getState(), false);
            });
        self.events.connect(self.components.startField, 'change', function(evt) {
            var obj = self.getState();

            // if the start time is greater then the endtime, make end time match start time
            if (obj.end < obj.start) {
                obj.end = obj.start;
                obj.endCode = obj.startCode;
                self.components.endField.value = obj.startCode;// HTML
            }
            self.storage.update(obj, false);
        });
        self.events.connect(self.components.endField, 'change', function(evt) {
            var obj = self.getState();

            // if the start time is greater then the endtime, make start time match end time
            if (obj.end < obj.start) {
                obj.start = obj.end;
                obj.startCode = obj.endCode;
                self.components.startField.value = obj.endCode;// HTML
            }
            self.storage.update(obj, false);
        });
        self.events.connect(self.components.playClip, 'click', function(evt) {
            var obj = self.getState();
            self.events.signal(self.targetview, 'playclip', { start: obj.start, end: obj.end });
        });
    };
    
    this.microformat.create = function(obj) {
        var htmlID = 'clipform';
        return {
            htmlID : htmlID,
            text : '<div id="' + htmlID + '">'
                +'<div id="clipcontrols" class="sherd-clipform">'
                +   '<div class="cliptimeboxtable">'
                +      '<table width="100%" >'
                +       '<tr class="sherd-clipform-editing">'
                +         '<td>'
                +           '<input type="button" class="regButton" value="start time:" id="btnClipStart"/>'
                +         '</td>'
                +         '<td class="sherd-clipform-timecodestart">'
                +           '<input type="text" class="timecode" id="clipStart" value="' + self.components.start + '" />'
                +         '</td>'
                +         '<td>'
                +           '<input type="button" class="regButton" value="end time:" id="btnClipEnd"/>'
                +         '</td>'
                +         '<td>'
                +           '<input type="text" class="timecode" id="clipEnd" value="' + self.components.end + '" />'
                +         '</td>'
                +       '</tr>'
                +       '<tr>'
                +         '<td colspan="4" class="sherd-clipform-play">'
                +           '<input type="button" class="regButton" value="play portion" id="btnPlayClip"/>'
                +         '</td>'
                +       '</tr>'
                +      '</table>'
                +  '</div>'
                +'</div></div>'
        };
    };
    
    this.microformat.components = function(html_dom, create_obj) 
    {
        var inputs = html_dom.getElementsByTagName('input');
        return {
            'form' : html_dom,
            'startButton' : document.getElementById('btnClipStart'),
            'endButton' : document.getElementById('btnClipEnd'),
            'startField' : document.getElementById('clipStart'),
            'endField' : document.getElementById('clipEnd'),
            'playClip' : document.getElementById('btnPlayClip'),
            'start': "00:00:00",
            'end': "00:00:00"
        };
    };
 };
}