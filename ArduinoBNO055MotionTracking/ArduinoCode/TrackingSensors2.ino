#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BNO055.h>
#include <utility/imumaths.h>

/* This driver uses the Adafruit unified sensor library (Adafruit_Sensor),
   which provides a common 'type' for sensor data and some helper functions.

   To use this driver you will also need to download the Adafruit_Sensor
   library and include it in your libraries folder.

   You should also assign a unique ID to this sensor for use with
   the Adafruit Sensor API so that you can identify this particular
   sensor in any data logs, etc.  To assign a unique ID, simply
   provide an appropriate value in the constructor below (12345
   is used by default in this example).

   Connections
   ===========
   Connect SCL to analog 5
   Connect SDA to analog 4
   Connect VDD to 3.3-5V DC
   Connect GROUND to common ground

   History
   =======
   2015/MAR/03  - First release (KTOWN)
*/

/* Set the delay between fresh samples */
#define BNO055_SAMPLERATE_DELAY_MS (100)


Adafruit_BNO055 SensorA = Adafruit_BNO055 (55, BNO055_ADDRESS_A);
Adafruit_BNO055 SensorB = Adafruit_BNO055 (56, BNO055_ADDRESS_B);


/*
 * Displays some basic information on this sensor from the unified
 * sensor API sensor_t type (see Adafruit_Sensor for more information)
 */
void displaySensorDetails (void)
{
    sensor_t sensor1;
    SensorA.getSensor (&sensor1);
    Serial.println("------------------------------------");
    Serial.print  ("Sensor:       "); Serial.println(sensor1.name);
    Serial.print  ("Driver Ver:   "); Serial.println(sensor1.version);
    Serial.print  ("Unique ID:    "); Serial.println(sensor1.sensor_id);
    Serial.print  ("Max Value:    "); Serial.print(sensor1.max_value); Serial.println(" xxx");
    Serial.print  ("Min Value:    "); Serial.print(sensor1.min_value); Serial.println(" xxx");
    Serial.print  ("Resolution:   "); Serial.print(sensor1.resolution); Serial.println(" xxx");
    Serial.println("------------------------------------");
    Serial.println("");

    sensor_t sensor2;
    SensorA.getSensor (&sensor2);
    Serial.println("------------------------------------");
    Serial.print  ("Sensor:       "); Serial.println(sensor2.name);
    Serial.print  ("Driver Ver:   "); Serial.println(sensor2.version);
    Serial.print  ("Unique ID:    "); Serial.println(sensor2.sensor_id);
    Serial.print  ("Max Value:    "); Serial.print(sensor2.max_value); Serial.println(" xxx");
    Serial.print  ("Min Value:    "); Serial.print(sensor2.min_value); Serial.println(" xxx");
    Serial.print  ("Resolution:   "); Serial.print(sensor2.resolution); Serial.println(" xxx");
    Serial.println("------------------------------------");
    Serial.println("");
    
    delay (500);
}


/*
 *  Arduino setup function (automatically called at startup)
 */
void setup (void)
{
    Serial.begin (115200);
    
    /* Initialise the sensor */
    if (!SensorA.begin())
    {
        /* There was a problem detecting the BNO055 ... check your connections */
        Serial.print ("Ooops, no BNO055 detected as sensor A... Check your wiring or I2C ADDR!");
        while (1);
    }
    if (!SensorB.begin())
    {
        /* There was a problem detecting the BNO055 ... check your connections */
        Serial.print ("Ooops, no BNO055 detected as sensor B... Check your wiring or I2C ADDR!");
        while (1);
    }

    Serial.println ('S');
    char a = 'W';
    while (a != 'S')
    {
        // Wait for a specific input from the computer
        a = Serial.read ();
    }
    
    delay (100);

    /* Display some basic information on this sensor 
    displaySensorDetails();*/
}


/*
 * Arduino loop function, called once 'setup' is complete (your own code
 * should go here)
 */
void loop (void)
{
    /* Get a new sensor event */
    sensors_event_t event;
    SensorA.getEvent (&event);

    /* Board layout:
         +----------+
         |         *| RST   PITCH  ROLL  HEADING
     ADR |*        *| SCL
     INT |*        *| SDA     ^            /->
     PS1 |*        *| GND     |            |
     PS0 |*        *| 3VO     Y    Z-->    \-X
         |         *| VIN
         +----------+
    */

    /* The processing sketch expects data as roll, pitch, heading */
    Serial.print(F(" OA: "));
    Serial.print((float)event.orientation.x);
    Serial.print(F(" "));
    Serial.print((float)event.orientation.y);
    Serial.print(F(" "));
    Serial.print((float)event.orientation.z);
    Serial.println(F(" "));

    SensorB.getEvent (&event);

    Serial.print(F(" OB: "));
    Serial.print((float)event.orientation.x);
    Serial.print(F(" "));
    Serial.print((float)event.orientation.y);
    Serial.print(F(" "));
    Serial.print((float)event.orientation.z);
    Serial.println(F(" "));


    delay (BNO055_SAMPLERATE_DELAY_MS);
}


