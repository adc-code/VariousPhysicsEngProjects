//
//  FileOutputState.m
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-23.
//
//

#import "FileOutputState.h"
#include <sys/time.h>


@implementation FileOutputState


- init
{
    self = [super init];
    if (self)
    {
        outputFile = NULL;
        outputMatLabFile = NULL;
        basefileName = @"OutputData";
        fileExtension = @"txt";
        
        outputState = NO;
        writeTime = YES;
        writeOrientationA = YES;
        writeOrientationB = YES;
        writeMatlabFile = YES;
    }
    
    return self;
}


- (void) dealloc
{
    if (outputFile)
        fclose (outputFile);
}


- (NSString*) getBaseFileName
{
    return basefileName;
}


- (void) setBaseFileName:(NSString*) newBaseFileName
{
    basefileName = newBaseFileName;
}


- (NSString*) getFilePath
{
    return filePath;
}


- (void) setFilePath:(NSString*) newFilePath
{
    filePath = newFilePath;
}


- (BOOL) getOutputState
{
    return outputState;
}


- (void) setOutputState:(BOOL) newState
{
    // if the new state is different to the current state then do something...
    if (outputState != newState)
    {
        outputState = newState;
        
        if (outputState == YES)
        {
            /*NSString * fullFilePath = [filePath stringByAppendingString:@"/"];
            fullFilePath = [fullFilePath stringByAppendingString:basefileName];
            fullFilePath = [fullFilePath stringByAppendingString:@"_"];
            fullFilePath = [fullFilePath stringByAppendingString:fileExtension];*/
            
            NSDate * currentDate = [NSCalendarDate date];
            NSString * fullFilePath = [NSString stringWithFormat: @"%@/%@_%@.%@",
                                       filePath, basefileName,
                                       [currentDate descriptionWithCalendarFormat:@"%m-%e-%Y-%I-%M-%S" timeZone:nil locale:nil],
                                       fileExtension];
            
            outputFile = fopen ([fullFilePath UTF8String], "w");
            
            
            NSString * fullFilePathML = [NSString stringWithFormat: @"%@/%@ML.m", filePath, basefileName];
            
            outputMatLabFile = fopen ([fullFilePathML UTF8String], "w");
            fprintf (outputMatLabFile, "%% Note: \n");
            fprintf (outputMatLabFile, "%% Data will be read into the following vectors: \n");
            fprintf (outputMatLabFile, "%%   TimeData - for the time data\n");
            fprintf (outputMatLabFile, "%%   Data1_Name - label for the first data element... can be discarded for data processing\n");
            fprintf (outputMatLabFile, "%%   Data1_Value1 - value of the first data element... for now yaw angle in degrees\n");
            fprintf (outputMatLabFile, "%%   Data1_Value2 - value of the first data element... for now pitch angle in degrees\n");
            fprintf (outputMatLabFile, "%%   Data1_Value3 - value of the first data element... for now roll angle in degrees\n");
            fprintf (outputMatLabFile, "%%   Data2_Name - label for the first data element... can be discarded for data processing\n");
            fprintf (outputMatLabFile, "%%   Data2_Value1 - value of the first data element... for now yaw angle in degrees\n");
            fprintf (outputMatLabFile, "%%   Data2_Value2 - value of the first data element... for now pitch angle in degrees\n");
            fprintf (outputMatLabFile, "%%   Data2_Value3 - value of the first data element... for now roll angle in degrees\n\n\n");
            
            fprintf (outputMatLabFile, "[TimeData, Data1_Name, Data1_Value1, Data1_Value2, Data1_Value3, ...\n");
            fprintf (outputMatLabFile, "    Data2_Name, Data2_Value1, Data2_Value2, Data2_Value3] = ...\n");
            fprintf (outputMatLabFile, "        textread ('%s', '%%s %%f %%f %%f %%s %%f %%f %%f', -1);\n", [fullFilePath UTF8String]);
            
            fclose (outputMatLabFile);

            gettimeofday (&startTime, NULL);
        }
        else
        {
            fclose (outputFile);
        }
    }
}



- (BOOL) writeToFile:(NSString*) lineToWrite
{
    if (outputState == YES)
    {
        //time_t currentTime = time (NULL);
        //long int nSeconds = difftime (currentTime, startTime);
        struct timeval currentTime;
        gettimeofday (&currentTime, NULL);
        
        double dSeconds = ((currentTime.tv_sec * 1000000.0 + currentTime.tv_usec)
                                   - (startTime.tv_sec * 1000000.0 + startTime.tv_usec))
                                   / 1000000;
        fprintf (outputFile, "%f %s\n", dSeconds, [lineToWrite UTF8String]);
        fflush (outputFile);
    }
    
    return outputState;
}




@end
