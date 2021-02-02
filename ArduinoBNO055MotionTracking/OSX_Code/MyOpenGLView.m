/*
     File: MyOpenGLView.m
 Abstract: An NSOpenGLView subclass that renders the scene
 
 */


#import "MyOpenGLView.h"
#import "Scene.h"

@implementation MyOpenGLView


- initWithFrame:(NSRect) frameRect
{
    NSOpenGLPixelFormatAttribute attrs[] =
    {
        // Specifying "NoRecovery" gives us a context that cannot fall back to
        // the software renderer.  This makes the View-based context a compatible
        // with the layer-backed context, enabling us to use the "shareContext"
        // feature to share textures, display lists, and other OpenGL objects
        // between the two.
        NSOpenGLPFANoRecovery,     // Enable automatic use of OpenGL "share" contexts.
        NSOpenGLPFAColorSize,      24,
        NSOpenGLPFAAlphaSize,       8,
        NSOpenGLPFADepthSize,      16,
        NSOpenGLPFADoubleBuffer,
        NSOpenGLPFAAccelerated,     0
    };
    
    // Create our pixel format; note that since using ARC, we will not worry
    // about deallocating
    NSOpenGLPixelFormat * pixelFormat = [[NSOpenGLPixelFormat alloc] initWithAttributes:attrs];

    self = [super initWithFrame:frameRect pixelFormat:pixelFormat];
    if (self)
    {
        scene = [[Scene alloc] init];
    }
    
    // Default background colour is dark grey...
    BGColour = [NSColor colorWithDeviceRed:0.125f green:0.125f blue:0.125f alpha:1.0f];
    
    return self;
}


- (void) dealloc
{
    // Using automatic reference counting... so things should be
    // done for 'free'
}


- (Scene*) scene
{
    return scene;
}


- (float)cameraDistance
{
    return [scene cameraDistance];
}


- (void)setCameraDistance:(float)newCameraDistance
{
    
    [scene setCameraDistance:newCameraDistance];
    [self setNeedsDisplay:YES];
}


- (float) getRotateVert
{
    return [scene getVertViewAngle];
}


- (void) setRotateVert:(float) newRotateVertAngle
{
    [scene setVertViewAngle:newRotateVertAngle];
    
    [self setNeedsDisplay:YES];
}


- (float) getRotateHorz
{
    return [scene getHorzViewAngle];
}


- (void) setRotateHorz:(float) newRotateHorzAngle
{
    [scene setHorzViewAngle:newRotateHorzAngle];
    
    [self setNeedsDisplay:YES];
}


- (NSColor*) getBGColour
{
    return BGColour;
}


- (void) setBGColour:(NSColor*) newBGColor
{
    BGColour = newBGColor;
}



- (float) getLightAngle
{
    return [scene getLightAngle];
}


- (void) setLightAngle:(float) newLightAngle
{
    [scene setLightAngle:newLightAngle];
    
    [self setNeedsDisplay:YES];
}



- (void)prepareOpenGL
{
    // AppKit automatically invokes the NSOpenGLView's -prepareOpenGL once when
    // a new NSOpenGLContext becomes current.
    
    [scene prepareOpenGL];
}



- (void)drawRect:(NSRect)aRect
{
    // Clear the framebuffer.
    glClearColor ( [BGColour redComponent], [BGColour greenComponent], [BGColour blueComponent], 1.0 );
    glClear ( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

    // Delegate to our scene object for the remainder of the frame rendering.
    [scene render];
    
    [[self openGLContext] flushBuffer];
}



- (void) reshape
{
    // Delegate to our scene object to update for a change in the view size.
    
    NSRect pixelBounds = [self convertRectToBase:[self bounds]];
    [scene setViewportRect:NSMakeRect ( 0, 0, pixelBounds.size.width, pixelBounds.size.height )];
}


- (BOOL)acceptsFirstResponder
{
    // We want this view to be able to receive key events.
    
    return YES;
}


- (void)keyDown:(NSEvent *)theEvent
{
    // Delegate to our controller object for handling key events.

    [controller keyDown:theEvent];
}


- (void)mouseDown:(NSEvent *)theEvent
{
    // Delegate to our controller object for handling mouse events.
    // even though we don't really do anything with them...
    
    [controller mouseDown:theEvent];
}


@end
