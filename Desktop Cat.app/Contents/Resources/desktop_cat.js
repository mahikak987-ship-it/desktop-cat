ObjC.import('Cocoa');
ObjC.import('WebKit');
ObjC.import('CoreGraphics');

// Set application activation policy to Accessory (floating companion without Dock clutter)
var app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyAccessory);

// Resolve resources directory
var args = $.NSProcessInfo.processInfo.arguments;
var resourcesDir = "/Users/apple/Desktop/first ai app/assets";
if (args.count > 1) {
  resourcesDir = ObjC.unwrap(args.objectAtIndex(1));
}

var imgPath = resourcesDir + "/cat.png";
if (!$.NSFileManager.defaultManager.fileExistsAtPath(imgPath)) {
  imgPath = "/Users/apple/Desktop/first ai app/assets/cat.png";
}

// Load local MP4 base64 video
var videoBase64 = "";
var b64Path = resourcesDir + "/video_base64.txt";
if (!$.NSFileManager.defaultManager.fileExistsAtPath(b64Path)) {
  b64Path = "/Users/apple/Desktop/first ai app/assets/video_base64.txt";
}
if ($.NSFileManager.defaultManager.fileExistsAtPath(b64Path)) {
  videoBase64 = $.NSString.stringWithContentsOfFileEncodingError(b64Path, $.NSUTF8StringEncoding, null).js.replace(/\s+/g, "");
}

// Global state variables
var globalWin = null;
var globalImageView = null;
var screamWebView = null;

var globalClickThrough = false;
var globalAlwaysOnTop = true;
var currentWidth = 240;

var isScreaming = false;
var screamActiveDuration = 0.0;

var enableInactivityScreamer = true;
var idleSeconds = 0.0;
var INACTIVITY_THRESHOLD = 10.0; // 10 seconds inactivity

var lastMouseLoc = $.NSEvent.mouseLocation;

// Helper to calculate bottom-right position
function getBottomRightFrame(w) {
  var screen = $.NSScreen.mainScreen;
  var frame = screen.visibleFrame;
  var h = Math.round(w * (582 / 300));
  var x = frame.origin.x + frame.size.width - w - 15;
  var y = frame.origin.y + 10;
  return { rect: $.NSMakeRect(x, y, w, h), w: w, h: h };
}

function getScreamHTML() {
  var videoContent = "";
  if (videoBase64 && videoBase64.length > 100) {
    videoContent = "<video id='v' autoplay loop playsinline src='data:video/mp4;base64," + videoBase64 + "'></video>";
  } else {
    videoContent = "<iframe width='100%' height='100%' src='https://www.youtube.com/embed/rE9T7MgQT3A?autoplay=1&mute=0&controls=0&loop=1&playlist=rE9T7MgQT3A' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' allowfullscreen></iframe>";
  }

  return "<!DOCTYPE html>" +
    "<html>" +
    "<head>" +
    "<meta charset='utf-8'>" +
    "<style>" +
    "* { margin: 0; padding: 0; overflow: hidden; background: #000; box-sizing: border-box; }" +
    "html, body { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #000; border-radius: 14px; }" +
    "video, iframe { width: 100%; height: 100%; border: none; object-fit: contain; border-radius: 14px; }" +
    "</style>" +
    "</head>" +
    "<body>" +
    videoContent +
    "</body>" +
    "</html>";
}

function triggerScream() {
  if (isScreaming) return;
  isScreaming = true;
  screamActiveDuration = 0.0;
  idleSeconds = 0.0;

  // Swap silent cat for screaming cat in the exact same corner frame
  if (globalImageView) globalImageView.hidden = true;
  if (screamWebView) {
    screamWebView.hidden = false;
    var html = getScreamHTML();
    screamWebView.loadHTMLStringBaseURL(html, $.NSURL.URLWithString("about:blank"));
  }
}

function dismissScream() {
  if (!isScreaming) return;
  isScreaming = false;
  screamActiveDuration = 0.0;
  idleSeconds = 0.0;

  // Unload video immediately to stop sound
  if (screamWebView) {
    screamWebView.loadHTMLStringBaseURL("<!DOCTYPE html><html><body style='background:#000;'></body></html>", $.NSURL.URLWithString("about:blank"));
    screamWebView.hidden = true;
  }
  // Restore peaceful business cat in the corner
  if (globalImageView) {
    globalImageView.hidden = false;
  }
}

// Controller to handle UI menu actions and timer
ObjC.registerSubclass({
  name: 'DesktopCatController',
  methods: {
    'quitApp:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        $.NSApplication.sharedApplication.terminate(null);
      }
    },
    'testScreamer:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        triggerScream();
      }
    },
    'toggleScreamer:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        enableInactivityScreamer = !enableInactivityScreamer;
        idleSeconds = 0.0;
        if (!enableInactivityScreamer && isScreaming) {
          dismissScream();
        }
        updateMenuItems();
      }
    },
    'resetPos:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        if (!globalWin) return;
        var info = getBottomRightFrame(currentWidth);
        globalWin.setFrameDisplayAnimate(info.rect, true, true);
      }
    },
    'setSizeMedium:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        changeCatSize(180);
      }
    },
    'setSizeLarge:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        changeCatSize(240);
      }
    },
    'setSizeGiant:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        changeCatSize(300);
      }
    },
    'toggleClickThrough:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        if (!globalWin) return;
        globalClickThrough = !globalClickThrough;
        globalWin.ignoresMouseEvents = globalClickThrough;
        updateMenuItems();
      }
    },
    'toggleAlwaysOnTop:': {
      types: ['void', ['id']],
      implementation: function(sender) {
        if (!globalWin) return;
        globalAlwaysOnTop = !globalAlwaysOnTop;
        globalWin.level = globalAlwaysOnTop ? $.NSFloatingWindowLevel : $.NSNormalWindowLevel;
        updateMenuItems();
      }
    },
    'timerTick:': {
      types: ['void', ['id']],
      implementation: function(timer) {
        var curMouse = $.NSEvent.mouseLocation;
        var dx = Math.abs(curMouse.x - lastMouseLoc.x);
        var dy = Math.abs(curMouse.y - lastMouseLoc.y);

        var keyIdle = $.CGEventSourceSecondsSinceLastEventType(1, 10);
        var clickIdle = $.CGEventSourceSecondsSinceLastEventType(1, 1);

        // Turn off IMMEDIATELY on any mouse motion (> 1px) or keystroke / click
        var userMoved = (dx > 1 || dy > 1 || keyIdle < 0.25 || clickIdle < 0.25);

        if (userMoved) {
          lastMouseLoc = curMouse;
          if (isScreaming) {
            dismissScream();
          }
          idleSeconds = 0.0;
        } else {
          if (!isScreaming) {
            if (enableInactivityScreamer) {
              idleSeconds += 0.2;
              if (idleSeconds >= INACTIVITY_THRESHOLD) {
                triggerScream();
              }
            }
          } else {
            screamActiveDuration += 0.2;
            // After 6.5s (full video finishes), auto-dismiss back to peaceful cat
            if (screamActiveDuration >= 6.5) {
              dismissScream();
            }
          }
        }
      }
    }
  }
});

var controller = $.DesktopCatController.alloc.init;

// Corner Cat Window Setup (Same frame for both silent and screaming cat)
var initInfo = getBottomRightFrame(currentWidth);
var win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
  initInfo.rect,
  $.NSWindowStyleMaskBorderless,
  $.NSBackingStoreBuffered,
  false
);

win.opaque = false;
win.backgroundColor = $.NSColor.clearColor;
win.level = $.NSFloatingWindowLevel;
win.hasShadow = false;
win.movableByWindowBackground = true;
win.collectionBehavior = $.NSWindowCollectionBehaviorCanJoinAllSpaces | 
                         $.NSWindowCollectionBehaviorStationary | 
                         $.NSWindowCollectionBehaviorFullScreenAuxiliary;

// Silent cat image view
var img = $.NSImage.alloc.initWithContentsOfFile(imgPath);
var imageView = $.NSImageView.alloc.initWithFrame($.NSMakeRect(0, 0, initInfo.w, initInfo.h));
imageView.image = img;
imageView.imageScaling = $.NSImageScaleProportionallyUpOrDown;
win.contentView.addSubview(imageView);

// Screaming cat WebKit view (same bounds in the same corner window!)
var config = $.WKWebViewConfiguration.alloc.init;
config.websiteDataStore = $.WKWebsiteDataStore.nonPersistentDataStore;
config.mediaTypesRequiringUserActionForPlayback = 0;
config.allowsInlineMediaPlayback = true;

screamWebView = $.WKWebView.alloc.initWithFrameConfiguration(
  $.NSMakeRect(0, 0, initInfo.w, initInfo.h),
  config
);
screamWebView.hidden = true;
win.contentView.addSubview(screamWebView);

globalWin = win;
globalImageView = imageView;

function changeCatSize(newWidth) {
  if (!globalWin || !globalImageView || !screamWebView) return;
  currentWidth = newWidth;
  var currentOrigin = globalWin.frame.origin;
  var newH = Math.round(newWidth * (582 / 300));
  
  var deltaW = newWidth - globalWin.frame.size.width;
  var newX = currentOrigin.x - deltaW;
  var newY = currentOrigin.y;

  var newRect = $.NSMakeRect(newX, newY, newWidth, newH);
  globalWin.setFrameDisplayAnimate(newRect, true, true);
  globalImageView.setFrame($.NSMakeRect(0, 0, newWidth, newH));
  screamWebView.setFrame($.NSMakeRect(0, 0, newWidth, newH));
  updateMenuItems();
}

// Menu References
var sizeMediumItem, sizeLargeItem, sizeGiantItem;
var clickThroughMenuItem, alwaysOnTopMenuItem, screamerMenuItem;

function createMenu() {
  var menu = $.NSMenu.alloc.init;

  var titleItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("🐱 Desktop Cat", "", "");
  titleItem.enabled = false;
  menu.addItem(titleItem);

  menu.addItem($.NSMenuItem.separatorItem);

  var testItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("⚡ Test Screamer (Instant)", "testScreamer:", "s");
  testItem.target = controller;
  menu.addItem(testItem);

  screamerMenuItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("🚨 10s Inactivity Screamer", "toggleScreamer:", "i");
  screamerMenuItem.target = controller;
  menu.addItem(screamerMenuItem);

  menu.addItem($.NSMenuItem.separatorItem);

  var resetItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("Snap to Bottom-Right", "resetPos:", "r");
  resetItem.target = controller;
  menu.addItem(resetItem);

  sizeMediumItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("Size: Medium (180px)", "setSizeMedium:", "");
  sizeMediumItem.target = controller;
  menu.addItem(sizeMediumItem);

  sizeLargeItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("Size: Large (240px)", "setSizeLarge:", "");
  sizeLargeItem.target = controller;
  menu.addItem(sizeLargeItem);

  sizeGiantItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("Size: Giant (300px)", "setSizeGiant:", "");
  sizeGiantItem.target = controller;
  menu.addItem(sizeGiantItem);

  menu.addItem($.NSMenuItem.separatorItem);

  clickThroughMenuItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("Click-Through Mode", "toggleClickThrough:", "t");
  clickThroughMenuItem.target = controller;
  menu.addItem(clickThroughMenuItem);

  alwaysOnTopMenuItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("Always on Top", "toggleAlwaysOnTop:", "a");
  alwaysOnTopMenuItem.target = controller;
  menu.addItem(alwaysOnTopMenuItem);

  menu.addItem($.NSMenuItem.separatorItem);

  var quitItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent("Quit Desktop Cat", "quitApp:", "q");
  quitItem.target = controller;
  menu.addItem(quitItem);

  return menu;
}

function updateMenuItems() {
  if (sizeMediumItem) sizeMediumItem.state = (currentWidth === 180) ? $.NSControlStateValueOn : $.NSControlStateValueOff;
  if (sizeLargeItem) sizeLargeItem.state = (currentWidth === 240) ? $.NSControlStateValueOn : $.NSControlStateValueOff;
  if (sizeGiantItem) sizeGiantItem.state = (currentWidth === 300) ? $.NSControlStateValueOn : $.NSControlStateValueOff;
  if (clickThroughMenuItem) clickThroughMenuItem.state = globalClickThrough ? $.NSControlStateValueOn : $.NSControlStateValueOff;
  if (alwaysOnTopMenuItem) alwaysOnTopMenuItem.state = globalAlwaysOnTop ? $.NSControlStateValueOn : $.NSControlStateValueOff;
  if (screamerMenuItem) screamerMenuItem.state = enableInactivityScreamer ? $.NSControlStateValueOn : $.NSControlStateValueOff;
}

// Menu Bar Item
var statusBar = $.NSStatusBar.systemStatusBar;
var statusItem = statusBar.statusItemWithLength(-1);
statusItem.button.title = "🐱";
statusItem.menu = createMenu();

// Context menu on the cat itself
win.contentView.menu = createMenu();
updateMenuItems();

// Fast 0.2s Timer for instantaneous mouse move detection and 10s idle tracking
var timer = $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
  0.2,
  controller,
  "timerTick:",
  null,
  true
);

// Display corner cat
win.orderFrontRegardless;

// Run Cocoa event loop
app.run();
