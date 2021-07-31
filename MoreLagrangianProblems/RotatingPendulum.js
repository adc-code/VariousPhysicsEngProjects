//
// isCanvasSupported: used to check if the browser supports the canvas
//
function isCanvasSupported ()
{
    var elem = document.createElement ('canvas');
    return !!(elem.getContext && elem.getContext ('2d'));
}

        
//
// canvasApp: the main canvas application
//
function canvasApp ()
{
    if (!isCanvasSupported())
    {
        return;
    }


    //
    // drawScreen: draws one simulation update cycle
    //
    function drawScreen ()
    {
        // draw the canvas or simulation area
        context.fillStyle = '#EEEEEE';
        context.fillRect (0, 0, theCanvas.width, theCanvas.height);

        // draw the walls
        context.strokeStyle = '#000000'; 
        context.strokeRect (1,  1, theCanvas.width-2, theCanvas.height-2);
		
        if (_SimState == SIM_STATE_PLAY)
            updateCalcs ();

        redrawSceen ();
    }


    //
    // SolveEquationsOfMotion: determined by solving the Largragian 
    //
    function SolveEquationsOfMotion (iStateVec)
    {
        // extract 
        var thetaDot = iStateVec[0];
        var theta    = iStateVec[1];

        var thetaDDot = _dCircRadius * _dOmega * _dOmega / _dPendLength * Math.cos (theta - _dPhi) 
                        - _dGravityConst / _dPendLength * Math.sin (theta);

        return [ thetaDDot, thetaDot ];
    }


    //
    // MakeStateVector... utility function used to create the state vector for a particular
    //                    step of the runge kutta calculation
    //
    function MakeStateVector (iStateVec, iKVec, iMultiplier)
    {
        var results = [];
        for (var i = 0; i < 2; i++)
            results.push (iStateVec[i] + iMultiplier * iKVec[i] * _dTimeStep);
      
        return results;
    }
	

    //
    // RK4_step: function that performs one step of the runge kutta solving of the equation of motion
    //
    function RK4_step (iStateVec)
    {
        var k1 = SolveEquationsOfMotion ( iStateVec )
        var k2 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k1, 0.5) );
        var k3 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k2, 0.5) );
        var k4 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k3, 1) );

        var results = [];
        for (var i = 0; i < 2; i++)
            results.push ( _dTimeStep * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) / 6 );

        return results;
    }


    //
    // AdjustAngle: utility function to keep the angle within a suitable range (+/- 2Pi)
    //
    function AdjustAngle (angle)
    {
        if (angle > 2*Math.PI)
            angle -= 2*Math.PI;
        else if (angle < -2*Math.PI)
            angle += 2*Math.PI;

        return angle;
    }


    //
    // update: updates the positions for all the balls
    //
    function updateCalcs ()
    {
        // Update the wheel position
        _dPhi = AdjustAngle (_dPhi + _dOmega * _dTimeStep); 

        // Solve the equations of motion for the pendulum 
        var simStepResults = RK4_step ( [ _dThetaDot, _dTheta ] );
        _dThetaDot += simStepResults [0];
        _dTheta = AdjustAngle (_dTheta + simStepResults [1]);

        // uncomment for debugging
        // console.log (_dThetaDot, _dTheta);
    }


    //
    // render: used to draw the elements to the canvas
    //
    function redrawSceen () 
    {
        var cnvsWidth  = theCanvas.width;
        var cnvsHeight = theCanvas.height;

        var circCenterX = cnvsWidth / 2;
        var circCenterY = _dVertPadding + _dMaxCircRadius;

        context.fillStyle = '#dddddd';

        // big circle
        context.save ();
        context.beginPath ();
        context.arc (circCenterX, circCenterY, _dCircRadius, 0, 2*Math.PI, true);
        context.lineWidth = 3;
        context.stroke ();
        context.restore ();         

        // wheel spokes
        for (var i = 0; i < 9; i++)
        {
            context.save ();
            context.strokeStyle = '#999999';
            context.beginPath ();
            context.moveTo (circCenterX, circCenterY);
         
            // note the negative on the phi... so that things behave a little more 'normally'
            context.lineTo (circCenterX + _dCircRadius * Math.cos (2 * Math.PI / 9 * i - _dPhi),
                            circCenterY + _dCircRadius * Math.sin (2 * Math.PI / 9 * i - _dPhi));
            context.stroke ();
            context.restore ();         
        }

        // pendulum line
        // again note the negative on the phi
        var pivotPosX = circCenterX + _dCircRadius * Math.cos (-1 * _dPhi);
        var pivotPosY = circCenterY + _dCircRadius * Math.sin (-1 * _dPhi);
        var pendPosX  = pivotPosX + _dPendLength * Math.sin (_dTheta);      
        var pendPosY  = pivotPosY + _dPendLength * Math.cos (_dTheta);

        context.save ();
        context.beginPath ();
        context.moveTo (pivotPosX, pivotPosY);
        context.lineTo (pendPosX, pendPosY);
        context.stroke ();
        context.restore ();         
         
        // pendulum pivot
        context.fillStyle = '#cccccc';
        
        context.save ();
        context.beginPath ();
        context.arc (pivotPosX, pivotPosY, 3, 0, 2*Math.PI, true);
        context.fill ();
        context.stroke ();

        // pendulum mass
        context.fillStyle = '#d9b3ff'; // pink

        context.save ();
        context.beginPath ();
        context.arc (pendPosX, pendPosY, 15, 0, 2*Math.PI, true);
        context.fill ();
        context.stroke ();
    }

	
    var theCanvas = document.getElementById ('canvasSimArea');
    var context   = theCanvas.getContext ('2d');

    // Some default values
    const DEFAULT_INITWHEELANGLE = 45 / 180 * Math.PI;   // angle in radians
    const DEFAULT_INITWHEELSPEED = 0.05;                 // radians per unit time... seconds
    const DEFAULT_WHEELRADIUSPCT = 75;                   // percent

    const DEFAULT_INITPREDANGLE  = 30 / 180 * Math.PI;   // pendulum angle in radians
    const DEFAULT_PREDLENGTH     = 75;
    const DEFAULT_INITSPEED      = 0.0;
    const DEFAULT_MASS           = 1.0;

    const DEFAULT_GRAVITYCONST   = 9.8;

    var _dVertPadding   = 10;

    // Wheel related variables...
    var _dPhi            = DEFAULT_INITWHEELANGLE;
    var _dOmega          = DEFAULT_INITWHEELSPEED;
    var _dWheelRadiusPct = DEFAULT_WHEELRADIUSPCT;
    var _dMaxCircRadius  = (theCanvas.height - 2 * _dVertPadding) / 4;
    var _dCircRadius     = _dMaxCircRadius * _dWheelRadiusPct * 0.01;
    
    // Pendulum related variables...
    var _dTheta          = DEFAULT_INITPREDANGLE;
    var _dThetaDot       = DEFAULT_INITSPEED;
    var _dLengthPct      = DEFAULT_PREDLENGTH;
    var _dMaxPendLength  = theCanvas.height / 2;
    var _dPendLength     = _dMaxPendLength * _dLengthPct * 0.01;

    var _dGravityConst   = DEFAULT_GRAVITYCONST;
        
    // Finally simulation related stuff...
    const SIM_STATE_STOP       = 1;
    const SIM_STATE_PLAY       = 2;

    var _dTimeStep  = 0.15;
    var _SimState   = SIM_STATE_STOP;
    var _SimTimerId = 0;


    //
    // DisableUI: Used to enable/disable the UI so parameters can't be changed during 
    //            the simulation
    //
    function DisableUI (iState)
    {
        document.getElementById ('ResetBtn').disabled = iState;
        if (iState == true)                    
            document.getElementById ('ResetBtn').classList = ['button disabledbutton'];
        else
            document.getElementById ('ResetBtn').classList = ['button enabledbutton'];

        document.getElementById ('wheelInitPosSlider').disabled = iState;
        document.getElementById ('initAngleSlider').disabled    = iState;
    }


    //
    // OnStartButtonClick: callback to handle the start/top button
    //
    function OnStartButtonClick ()
    {
        if (_SimState == SIM_STATE_STOP)
        {
            // If STOPPED go to PLAY state

            _SimState = SIM_STATE_PLAY;
            document.getElementById ('StartBtn').innerHTML = 'Stop';

            DisableUI (true);

            // Start the simulation
            _SimTimerId = setInterval (drawScreen, 20);
        }
        else if (_SimState == SIM_STATE_PLAY)
        {
            // if PLAYING go to STOP state

            _SimState = SIM_STATE_STOP;
            document.getElementById ('StartBtn').innerHTML = 'Start';

            DisableUI (false);

            // Reset the initial positions to their current values
            var wheelInitPos = Math.round (_dPhi * 180 / Math.PI);
            document.getElementById ('wheelInitPosSlider').value = wheelInitPos;
            document.getElementById ('wheelInitPosOutput').value = wheelInitPos + '°';
            var angle = Math.round (_dTheta * 180 / Math.PI);
            document.getElementById ('initAngleSlider').value = angle;
            document.getElementById ('initAngleOutput').value = angle + '°';

            // Also, set the pendulum speed to zero
            _dThetaDot = 0;

            // Stop the simulation 
            clearTimeout (_SimTimerId);
        }
    }


    function SetParamsValues ()
    {
        _dPhi            = DEFAULT_INITWHEELANGLE;
        _dOmega          = DEFAULT_INITWHEELSPEED;
        _dWheelRadiusPct = DEFAULT_WHEELRADIUSPCT;
        _dCircRadius     = _dMaxCircRadius * _dWheelRadiusPct * 0.01;

        _dTheta          = DEFAULT_INITPREDANGLE;
        _dThetaDot       = DEFAULT_INITSPEED;
        _dLengthPct      = DEFAULT_PREDLENGTH;
        _dPendLength     = _dMaxPendLength * _dLengthPct * 0.01;

        _dGravityConst   = DEFAULT_GRAVITYCONST;

        // Then the UI elements...
        var wheelInitPos = Math.round (_dPhi * 180 / Math.PI);
        document.getElementById ('wheelInitPosSlider').value = wheelInitPos;
        document.getElementById ('wheelInitPosOutput').value = wheelInitPos + '°';

        document.getElementById ('wheelSpeedSlider').value = _dOmega;
        document.getElementById ('wheelSpeedOutput').value = _dOmega.toFixed (2);

        document.getElementById ('wheelRadiusSlider').value = _dWheelRadiusPct;
        document.getElementById ('wheelRadiusOutput').value = _dWheelRadiusPct;

        var angle = Math.round (_dTheta * 180 / Math.PI);
        document.getElementById ('initAngleSlider').value = angle;
        document.getElementById ('initAngleOutput').value = angle + '°';

        document.getElementById ('lengthSlider').value = _dLengthPct;
        document.getElementById ('lengthOutput').value = _dLengthPct;

        document.getElementById ('gravitySlider').value = _dGravityConst;
        document.getElementById ('gravityOutput').value = _dGravityConst;

        drawScreen ();        
    }


    //
    // OnResetButtonClick: callback to handle the start/top button
    //
    function OnResetButtonClick ()
    {
        SetParamsValues ();
        drawScreen ();
    }


    //
    // OnWheelInitPosChange: callback to handle the wheel initial position slider
    //
    function OnWheelInitPosChange ()
    {
        var wheelInitPos = +document.getElementById ('wheelInitPosSlider').value;
        document.getElementById ('wheelInitPosOutput').value = wheelInitPos + '°';

        _dPhi = wheelInitPos * Math.PI / 180.0;

        drawScreen ();
    }


    //
    // OnWheelSpeedChange: callback to handle wheel speed slider
    //
    function OnWheelSpeedChange ()
    {
        _dOmega = +document.getElementById ('wheelSpeedSlider').value;
        document.getElementById ('wheelSpeedOutput').value = _dOmega.toFixed (2);
    }


    //
    // OnWheelRadiusChange: callback to handle wheel radius slider
    //
    function OnWheelRadiusChange ()
    {
        _dWheelRadiusPct = +document.getElementById ('wheelRadiusSlider').value;
        document.getElementById ('wheelRadiusOutput').value = _dWheelRadiusPct;

        _dCircRadius = _dMaxCircRadius * _dWheelRadiusPct * 0.01;

        drawScreen ();
    }


    // 
    // OnInitAngleSliderChange: callback to handle changes with the initial angle slider
    //
    function OnInitAngleSliderChange ()
    {
        var angle = document.getElementById ('initAngleSlider').value;
        document.getElementById ('initAngleOutput').value = angle + '°';

        _dTheta = angle / 180 * Math.PI;

        drawScreen ();
    }


    //
    // OnInitSpeedSliderChange: callback to handle changes with the initial speed slider
    //
    function OnInitSpeedSliderChange ()
    {
        _dOmega = +document.getElementById ('initSpeedSlider').value;
        document.getElementById ('initSpeedTextBox').value = (_dOmega * 180 / Math.PI).toFixed (1);
    }


    //
    // OnLengthSliderChange: callback to handle changes with the length slider
    //
    function OnLengthSliderChange ()
    {
        _dLengthPct = document.getElementById ('lengthSlider').value;
        document.getElementById ('lengthOutput').value = _dLengthPct;

        _dPendLength = _dMaxPendLength * _dLengthPct * 0.01;

        drawScreen ();
    }


    //
    // OnGravitySliderChange: callback to handle changes with the gravity slider
    //
    function OnGravitySliderChange ()
    {
        _dGravityConst = document.getElementById ('gravitySlider').value;
        document.getElementById ('gravityOutput').value = _dGravityConst;
    }


    //	
    // register all the callbacks...
    //
    document.getElementById ('StartBtn').addEventListener ('click', OnStartButtonClick);
    document.getElementById ('ResetBtn').addEventListener ('click', OnResetButtonClick);

    document.getElementById ('wheelInitPosSlider').addEventListener ('change', OnWheelInitPosChange);
    document.getElementById ('wheelInitPosSlider').addEventListener ('input', OnWheelInitPosChange);

    document.getElementById ('wheelSpeedSlider').addEventListener ('change', OnWheelSpeedChange);
    document.getElementById ('wheelSpeedSlider').addEventListener ('input', OnWheelSpeedChange);

    document.getElementById ('wheelRadiusSlider').addEventListener ('change', OnWheelRadiusChange);
    document.getElementById ('wheelRadiusSlider').addEventListener ('input', OnWheelRadiusChange);

    document.getElementById ('initAngleSlider').addEventListener ('change', OnInitAngleSliderChange);
    document.getElementById ('initAngleSlider').addEventListener ('input', OnInitAngleSliderChange);

    document.getElementById ('lengthSlider').addEventListener ('change', OnLengthSliderChange);
    document.getElementById ('lengthSlider').addEventListener ('input', OnLengthSliderChange);

    document.getElementById ('gravitySlider').addEventListener ('change', OnGravitySliderChange);
    document.getElementById ('gravitySlider').addEventListener ('input', OnGravitySliderChange);

    SetParamsValues (true);
    drawScreen ();
}



