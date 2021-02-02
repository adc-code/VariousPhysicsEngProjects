//
//  PositionTrace.m
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-19.
//
//


#import "PositionTrace.h"

@implementation PositionTrace


- init
{
    self = [super init];
    
    if (self)
    {
        colour       = [NSColor colorWithDeviceRed:1.0f green:1.0f blue:1.0f alpha:1.0f];
        
        // plot type... 1 for points, 2 for line
        nPlotType    = 1;
        
        // display trace... on or off
        displayMode  = YES;
        
        // record state... on or off
        recordState  = NO;
    
        dataPoints_X = [[NSMutableArray alloc] init];
        dataPoints_Y = [[NSMutableArray alloc] init];
        dataPoints_Z = [[NSMutableArray alloc] init];
    }
    
    return self;
}


- (NSColor*) getColor
{
    return colour;
}


- (void) setColor:(NSColor*) newColor
{
    colour = newColor;
}


- (int) getPlotType
{
    return nPlotType;
}


- (void) setPlotType:(int) newType
{
    nPlotType = newType;
}


- (BOOL) getDisplayMode
{
    return displayMode;
}


- (void) setDisplayMode:(BOOL) newDisplayMode
{
    displayMode = newDisplayMode;
}


- (BOOL) getRecordState
{
    return recordState;
}


- (void) setRecordState:(BOOL) newRecordState
{
    recordState = newRecordState;
}


- (void) AddPoint:(float [3]) pointData
{
    [dataPoints_X addObject:[NSNumber numberWithFloat:pointData[0]]];
    [dataPoints_Y addObject:[NSNumber numberWithFloat:pointData[1]]];
    [dataPoints_Z addObject:[NSNumber numberWithFloat:pointData[2]]];
}


- (int) getNumberPoints
{
    return [dataPoints_X count];
}


- (float *) getPoint:(int) index
{
    static float data [3];
    
    data [0] = [[dataPoints_X objectAtIndex:index] floatValue];
    data [1] = [[dataPoints_Y objectAtIndex:index] floatValue];
    data [2] = [[dataPoints_Z objectAtIndex:index] floatValue];
    
    return data;
}


- (void) RemoveAllPoints
{
    [dataPoints_X removeAllObjects];
    [dataPoints_Y removeAllObjects];
    [dataPoints_Z removeAllObjects];
}


@end
