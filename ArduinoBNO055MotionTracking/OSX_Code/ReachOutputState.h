//
//  ReachOutputState.h
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-24.
//
//


#import <Cocoa/Cocoa.h>

#include <stdio.h>
#include <time.h>
#include <stdlib.h>


@interface ReachOutputState : NSObject
{
    // file name related
    NSString * basefileName;
    NSString * filePath;
    NSString * fileExtension;

    // writing or not writing data to file
    BOOL outputState;
    
    // type of test... no weight, with weight1, with weight2
    int  testType;
    
    int  targetNumber;

    struct timeval startTime;

    BOOL writeMatlabFile;

    FILE * outputFile;
}


- init;

- (void)dealloc;

- (NSString*) getBaseFileName;
- (void)      setBaseFileName:(NSString*) newBaseFileName;

- (NSString*) getFilePath;
- (void)      setFilePath:(NSString*) newFilePath;

- (int)  getTestType;
- (void) setTestType:(int) newTestType;

- (int)  getTargetNumber;
- (void) setTargetNumber:(int) newTargetNumber;

- (BOOL) getOutputState;
- (void) setOutputState:(BOOL) newState;

- (BOOL) writeToFile:(NSString*) lineToWrite;


@end
