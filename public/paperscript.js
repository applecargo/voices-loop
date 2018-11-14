// a paperscript (paperjs)

$(document).ready(function() {

  //common metrics
  var vs = view.size;
  var vsw = vs.width;
  var vsh = vs.height;
  var vss = view.size / 10;
  var vssw = vss.width;
  var vssh = vss.height;

  //screen changer
  var nscreen = 2;
  var screens = [];
  var screen_names = {};
  screen_names['select'] = 1;
  screen_names['play'] = 2;
  var curscreen;
  for (var idx = 0; idx < nscreen; idx++) {
    screens.push(new Layer());
  }

  function changeScreen(page) {
    //
    if (page < 1) page = 1;
    if (page > nscreen) page = nscreen;
    curscreen = page;
    for (var idx = 0; idx < nscreen; idx++) {
      if (idx == page - 1) {
        screens[idx].bringToFront();
        top.bringToFront();
      } else {
        screens[idx].sendToBack();
      }
    }
  }

  function nextScreen() {
    if (curscreen + 1 <= nscreen) {
      curscreen++;
      changeScreen(curscreen);
    }
  }

  function prevScreen() {
    if (curscreen - 1 > 0) {
      curscreen--;
      changeScreen(curscreen);
    }
  }

  function changeScreenByName(pagename) {
    changeScreen(screen_names[pagename]);
  }

  function getScreenNameNext() {
    if (curscreen + 1 <= nscreen) {
      return Object.keys(screen_names)[curscreen + 1 - 1];
    } else {
      return Object.keys(screen_names)[curscreen - 1];
    }
  }

  function getScreenNamePrev() {
    if (curscreen - 1 > 0) {
      return Object.keys(screen_names)[curscreen - 1 - 1];
    } else {
      return Object.keys(screen_names)[curscreen - 1];
    }
  }

  //top layer
  var top = new Layer(); // new Layer() will be automatically activated at the moment.

  //networking - socket.io
  // var socket = io('http://localhost:8080');
  var socket = io('http://192.168.43.49:8080');
  // var socket = io('https://choir.run');

  //net. connection marker
  var netstat = new Path.Circle({
    center: view.bounds.topRight + [-vssw / 2, +vssw / 2],
    radius: vssw / 4,
    fillColor: 'hotpink',
    strokeWidth: 2,
    strokeColor: 'gray',
    dashArray: [4, 4],
    onFrame: function(event) {
      this.rotate(1);
    }
  });
  netstat.fillColor.alpha = 0;

  //
  socket.on('connect', function() {
    console.log("i' m connected!");
    top.activate();
    netstat.fillColor.alpha = 1;
    socket.on('disconnect', function() {
      console.log("i' m disconnected!");
      top.activate();
      netstat.fillColor.alpha = 0;
    });
  });

  //screen #1
  changeScreen(1);
  new Path.Rectangle([0, 0], vs).fillColor = '#abc';

  var c = new Path.Circle({
    center: [vssw * 5, vssw * 5 + vssw * 1],
    radius: vssw * 4,
    strokeColor: 'white',
    strokeWidth: 1,
    dashArray: [6, 2, 2, 2]
  });

  //color list
  var colors = { // bg : fg
     'red' : 'white',
     'orange' : 'blue',
     'yellow' : 'brown',
     'green' : 'white',
     'lime' : '#a3f',
     'blue' : 'gold',
     'violet' : 'lime',
     'white' : 'black',
  }

  //make a selection
  var seat = {
    selected: 0
  };
  for (var idx = 0; idx < 8; idx++) {
    var d = c.getPointAt(c.length * 0.125 * idx + c.length * 0.125 * 0.5);
    new Group({
      children: [
        new Path.Circle({
          center: d,
          radius: vssw * 1,
          fillColor: Object.keys(colors)[idx],
          strokeColor: colors[Object.keys(colors)[idx]],
          strokeWidth: 2
        }),
        new PointText({
          content: idx,
          point: d,
          fillColor: colors[Object.keys(colors)[idx]],
          fontSize: '3em'
        })
      ],
      _idx: idx,
      onClick: function() {
        seat.selected = this._idx;
        ind.fillColor = Object.keys(colors)[seat.selected];
        nextScreen();
      }
    })
  }

  //screen #2
  changeScreen(2);
  new Path.Rectangle([0, 0], vs).fillColor = '#abc';

  //seat indicator
  var ind = new Path({
    segments: [
      [0, 0],
      [vssw * 1.5, 0],
      [0, vssh * 1.5]
    ],
    onClick: function() {
      prevScreen();
    }
  })

  //key list
  // var keys = {
  //   'C4': 60,
  //   'D4': 62,
  //   'E4': 64,
  //   'F4': 65,
  //   'G4': 67,
  //   'A4': 69,
  //   'B4': 71,
  //   'C5': 72,
  //   'D5': 74,
  //   'E5': 76,
  // }
  var keys = {
    'C4': 0,
    'D4': 1,
    'E4': 2,
    'F4': 3,
    'G4': 4,
    'A4': 5,
    'B4': 6,
    'C5': 7,
    'D5': 8,
    'E5': 9,
  }

  //white keys
  var keysize = vssw * 1;
  for (var idx = 0; idx < 10; idx++) {
    new Path.Rectangle({
      point: [vssw * 2.5, (keysize + 5) * idx + vssw * 1.5],
      size: [vssw * 5, keysize],
      fillColor: 'white',
      _offColor: 'white',
      _onColor: new Color({
        hue: getRandom(0, 360),
        saturation: 1,
        brightness: 1
      }),
      _key_id: keys[Object.keys(keys)[Object.keys(keys).length - idx - 1]],
      _key_name: Object.keys(keys)[Object.keys(keys).length - idx - 1],
      _onKeyPressed: function() {
        this.fillColor = this._onColor;
        var msg = {
          seat: seat.selected,
          id: this._key_id,
          name: this._key_name,
          value: 1,
          state: 'on',
        };
        console.log(msg);
        socket.emit('key', msg);
      },
      _onKeyReleased: function() {
        this.fillColor = this._offColor;
        var msg = {
          seat: seat.selected,
          id: this._key_id,
          name: this._key_name,
          value: 0,
          state: 'off',
        };
        console.log(msg);
        socket.emit('key', msg);
      },
      _init: function() {
        this.onMouseDown = this._onKeyPressed;
        this.onMouseUp = this._onKeyReleased;
        this.onMouseLeave = this._onKeyReleased;
      }
    })._init();
  }
  //black keys
  var idx = 0
  var keysize2 = vssw * 0.9;
  for (; idx < 2; idx++) {
    new Path.Rectangle({
      point: [vssw * 2.0 + vssw * -0.1, (keysize + 7) * idx + vssw * 1.5 + keysize / 2],
      size: [vssw * 3, keysize2],
      fillColor: '#444'
    });
  }
  for (; idx < 5; idx++) {
    new Path.Rectangle({
      point: [vssw * 2.0 + vssw * -0.1, (keysize + 7) * idx + vssw * 1.5 + keysize / 2 + keysize],
      size: [vssw * 3, keysize2],
      fillColor: '#444'
    });
  }
  for (; idx < 7; idx++) {
    new Path.Rectangle({
      point: [vssw * 2.0 + vssw * -0.1, (keysize + 7) * idx + vssw * 1.5 + keysize / 2 + keysize * 2],
      size: [vssw * 3, keysize2],
      fillColor: '#444'
    });
  }

  //back to the starting page
  changeScreen(1);

  //network event handlers

  //event: 'sound'
  socket.on('sound', function(sound) {
    if (sound.name == 'clap') {
      if (sound.action == 'start') {
        clap.start();
      }
    }
  });

});
