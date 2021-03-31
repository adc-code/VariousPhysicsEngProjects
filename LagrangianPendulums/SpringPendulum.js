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
        {
            updateCalcs ();

            if ( Math.abs (_dCurrXPos - _dPrevXPos) < ZERO_TOLERANCE && 
                 Math.abs (_dCurrYPos - _dPrevYPos) < ZERO_TOLERANCE ) 
            {
                _SimState = SIM_STATE_STOP;
                document.getElementById ('StartBtn').innerHTML = 'Start';

                SetParamsValues (false);

                DisableUI (false);
                clearTimeout (_SimTimerId);
            }
        }

        redrawSceen ();
    }


    // 
    // SolveEquationsOfMotion: solves the equations of motion, that is omega double dot and x double dot
    //                         which are produced by the solving the lagrangian
    //
    function SolveEquationsOfMotion (iStateVec)
    {
        // extract values from the state vector 
        var springVel = iStateVec[0];
        var omega     = iStateVec[1];
        var springPos = iStateVec[2];
        var theta     = iStateVec[3];

        var spring_accel = 0.05 * ( (_dLength + springPos) * omega * omega - _dKConst / _dMass * springPos + _dGravityConst * Math.cos (theta));
        var omega_dot = -2 / (_dLength + springPos) * omega * springVel - _dGravityConst / (_dLength + springPos) * Math.sin (theta);

        spring_accel += -1 * _dSpringDampingConst * springVel;        
        omega_dot    += -1 * _dPendulumDampingConst * omega;

        return [ spring_accel, omega_dot, springVel, omega ];
    }

  
    //
    // MakeStateVector: utility function used to compute the state vector for the runge-kutta calculations
    //
    function MakeStateVector (iStateVec, iKVec, iMultiplier)
    {
        var results = [];
        for (var i = 0; i < 4; i++)
            results.push (iStateVec[i] + iMultiplier * iKVec[i] * _dTimeStep);
      
        return results;
    }


    //
    // RK4_step: perform one step of the Runge Kutta solution...
    //
    function RK4_step (iStateVec)
    {
        var k1 = SolveEquationsOfMotion ( iStateVec )
        var k2 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k1, 0.5) );
	var k3 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k2, 0.5) );
	var k4 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k3, 1) );

        var results = [ _dTimeStep * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]) / 6,
                        _dTimeStep * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]) / 6, 
                        _dTimeStep * (k1[2] + 2*k2[2] + 2*k3[2] + k4[2]) / 6, 
                        _dTimeStep * (k1[3] + 2*k2[3] + 2*k3[3] + k4[3]) / 6 ];

        return results;
    }	


    //
    // update: updates the positions for all the balls
    //
    function updateCalcs ()
    {
        _dPrevTheta = _dTheta;
        _dPrevXPos = (_dLength + _dSpringLength) * Math.sin (_dTheta);
        _dPrevYPos = (_dLength + _dSpringLength) * Math.cos (_dTheta);

        //var simStepResults = RK4_step ( [_dSpringSpeed, _dOmega, _x, _dTheta] );
        var simStepResults = RK4_step ( [_dSpringSpeed, _dOmega, _dSpringLength, _dTheta] );

        // uncomment for debugging
        // console.log (_dSpringLength, _dTheta);

        _dSpringSpeed  += simStepResults [0];
        _dOmega        += simStepResults [1];
        _dSpringLength += simStepResults [2];
        _dTheta        += simStepResults [3];

        // Compute the position of the ball/bob
        _dCurrXPos = (_dLength + _dSpringLength) * Math.sin (_dTheta);
        _dCurrYPos = (_dLength + _dSpringLength) * Math.cos (_dTheta);
    }


    /*function computeCurrentPositon ()
    {
        _dCurrXPos = (_dLength + _dSpringLength) * Math.sin (_dTheta);
        _dCurrYPos = (_dLength + _dSpringLength) * Math.cos (_dTheta);
    }*/


    //
    // render: used to draw the elements to the canvas
    //
    function redrawSceen () 
    {
        var cnvsWidth  = theCanvas.width;
        var cnvsHeight = theCanvas.height;

        var boxWidth  = cnvsWidth / 5;
        var boxHeight = cnvsHeight / 25;

        var xOrigin = cnvsWidth / 2;
        var yOrigin = boxHeight * 3;
        
        // clear the window area...
        context.fillStyle = '#666666';
        context.fillRect ((cnvsWidth - boxWidth) / 2, boxHeight  * 2, boxWidth, boxHeight);

        // draw the trail if necessary
        if (_DrawTrail)
        {
            _TrailPoints.push ( [ _dCurrXPos, _dCurrYPos ] );
            while (_TrailPoints.length > _nTrailLength)
            { 
                _TrailPoints.shift ();
            }

            context.beginPath ();
            context.moveTo (xOrigin + _TrailPoints[0][0], yOrigin + _TrailPoints[0][1]);
            for (var i = 1; i < _TrailPoints.length; i++)
            {
                context.strokeStyle = '#000066';
                context.lineTo (xOrigin + _TrailPoints[i][0], yOrigin + _TrailPoints[i][1]);
            }
            context.stroke ();
            context.strokeStyle = '#000';
        }

        // Draw the spring...
        context.translate (xOrigin, yOrigin);
        context.beginPath();
        context.moveTo (0, 0); 
        context.rotate (0.5*Math.PI - _dTheta); 

        // Note that all the values were found using trial and error... its not the best solution
        // but it works for now.       
        var B = 7 * (_dLength + _dSpringLength) / (1.5 * DEFAULT_LENGTH);
        for (var i = 2.9; i < 94; i+=0.1)
        {
           context.lineTo (10 * Math.cos (i) * Math.cos(13) + B * i * Math.sin(13), 7 * Math.sin (i));
        }
        context.stroke ();
        context.rotate (-1 * (0.5*Math.PI - _dTheta)); 
        context.translate (-xOrigin, -yOrigin);
     
        // draw the spring origin, that is the point where it pivots
        context.fillStyle = '#cccccc';
        context.beginPath ();
        context.arc (xOrigin, yOrigin, BALL_RADIUS, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        // draw the ball/bob at the end spring
        context.fillStyle = '#e699ff';
        context.beginPath ();
        context.arc (xOrigin + _dCurrXPos, yOrigin + _dCurrYPos, BALL_RADIUS * Math.sqrt (_dMass), 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();
    }

	


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

        document.getElementById ('initSpeedSlider').disabled    = iState;
        document.getElementById ('initSpeedTextBox').disabled   = iState;

        document.getElementById ('initAngleSlider').disabled    = iState;
        document.getElementById ('initAngleTextBox').disabled   = iState;

        document.getElementById ('lengthSlider').disabled       = iState;
        document.getElementById ('lengthTextBox').disabled      = iState;

        document.getElementById ('massSlider').disabled         = iState;
        document.getElementById ('massTextBox').disabled        = iState;

        document.getElementById ('springConstSlider').disabled  = iState;
        document.getElementById ('springConstTextBox').disabled = iState;

        document.getElementById ('damping1Slider').disabled     = iState;
        document.getElementById ('damping1TextBox').disabled    = iState;

        document.getElementById ('damping2Slider').disabled     = iState;
        document.getElementById ('damping2TextBox').disabled    = iState;

        document.getElementById ('gravitySlider').disabled      = iState;
        document.getElementById ('gravityTextBox').disabled     = iState;
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

            SetParamsValues (false); 
            DisableUI (false);

            // Stop the simulation 
            clearTimeout (_SimTimerId);
        }
    }

  
    //
    // SetParamsValues: used to set the initial values...
    //
    function SetParamsValues (iUseDefaults)
    {
        if (iUseDefaults == true)
        {
            // First the variables...
            _dTheta                = DEFAULT_INITANGLE;
            _dOmega                = DEFAULT_INITSPEED;
            _dSpringSpeed          = DEFAULT_INITSPEED;
            _dLength               = DEFAULT_LENGTH;
            _dMass                 = DEFAULT_MASS;
            _dKConst               = DEFAULT_KCONST;
            _dPendulumDampingConst = DEFAULT_PENDDAMPINGCONST;
            _dSpringDampingConst   = DEFAULT_SPRINGDAMPINGCONST;
            _dGravityConst         = DEFAULT_GRAVITYCONST;
        }
 
        _dPrevXPos = -999;
        _dPrevYPos = -999;
        _dCurrXPos = (_dLength + _dSpringLength) * Math.sin (_dTheta);
        _dCurrYPos = (_dLength + _dSpringLength) * Math.cos (_dTheta);

        // Then the UI elements...
        document.getElementById ('initSpeedSlider').value    = _dOmega;
        document.getElementById ('initSpeedTextBox').value   = (_dOmega * 180 / Math.PI).toFixed (1);

        document.getElementById ('initAngleSlider').value    = _dTheta * 180 / Math.PI;
        document.getElementById ('initAngleTextBox').value   = (_dTheta * 180 / Math.PI).toFixed (1) + '°';

        document.getElementById ('lengthSlider').value       = _dLength * 100 / _dMaxLength;
        document.getElementById ('lengthTextBox').value      = (_dLength * 100 / _dMaxLength).toFixed (0);

        document.getElementById ('massSlider').value         = _dMass;
        document.getElementById ('massTextBox').value        = _dMass;

        document.getElementById ('springConstSlider').value  = _dKConst;
        document.getElementById ('springConstTextBox').value = _dKConst;

        document.getElementById ('damping1Slider').value     = _dPendulumDampingConst;
        document.getElementById ('damping1TextBox').value    = _dPendulumDampingConst;

        document.getElementById ('damping2Slider').value     = _dSpringDampingConst;
        document.getElementById ('damping2TextBox').value    = _dSpringDampingConst;

        document.getElementById ('gravitySlider').value      = _dGravityConst;
        document.getElementById ('gravityTextBox').value     = _dGravityConst;

        document.getElementById ('ResetBtn').disabled        = false; 
    }


    //
    // OnResetButtonClick: callback to handle the start/top button
    //
    function OnResetButtonClick ()
    {
        if (document.getElementById ('ResetBtn').disabled == false)
        {
            SetParamsValues (true);

            // Make sure that no trail is drawn
            _TrailPoints = [];
            
            // redraw everything...
            drawScreen ();
        }
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
    // OnInitAngleSliderChange: callback to handle changes with the initial angle slider
    //
    function OnInitAngleSliderChange ()
    {
        var angle = document.getElementById ('initAngleSlider').value;
        document.getElementById ('initAngleTextBox').value = angle + '°';

        _dTheta = angle / 180 * Math.PI;

        _dCurrXPos = (_dLength + _dSpringLength) * Math.sin (_dTheta);
        _dCurrYPos = (_dLength + _dSpringLength) * Math.cos (_dTheta);

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    //
    // OnLengthSliderChange: callback to handle changes with the length slider
    //
    function OnLengthSliderChange ()
    {
        var dLengthPercent = document.getElementById ('lengthSlider').value;
        _dLength = _dMaxLength * dLengthPercent * 0.01;

        document.getElementById ('lengthTextBox').value = dLengthPercent;

        _dCurrXPos = (_dLength + _dSpringLength) * Math.sin (_dTheta);
        _dCurrYPos = (_dLength + _dSpringLength) * Math.cos (_dTheta);

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }

 
    //
    // OnMassSliderChange: callback to handle changes with the mass slider
    //
    function OnMassSliderChange ()
    {
        _dMass = +document.getElementById ('massSlider').value;
        document.getElementById ('massTextBox').value = _dMass;

        drawScreen ();
    }


    //
    // OnKSliderChange: callback to handle changes with the K constant
    //
    function OnKSliderChange ()
    {
        _dKConst = +document.getElementById ('springConstSlider').value;
        document.getElementById ('springConstTextBox').value = _dKConst;
    }


    //
    // OnDamping1SliderChange: callback to handle changes with the dampling slider
    //
    function OnDamping1SliderChange ()
    {
        _dPendulumDampingConst = document.getElementById ('damping1Slider').value;
        document.getElementById ('damping1TextBox').value = _dPendulumDampingConst;
    }


    //
    // OnDamping2SliderChange: callback to handle changes with the dampling slider
    //
    function OnDamping2SliderChange ()
    {
        _dSpringDampingConst = document.getElementById ('damping2Slider').value;
        document.getElementById ('damping2TextBox').value = _dSpringDampingConst;
    }


    //
    // OnGravitySliderChange: callback to handle changes with the gravity slider
    //
    function OnGravitySliderChange ()
    {
        _dGravityConst = document.getElementById ('gravitySlider').value;
        document.getElementById ('gravityTextBox').value = _dGravityConst;
    }


    //
    // OnTrailLengthListChange: callback to handle the trail list length
    //
    function OnTrailLengthListChange ()
    {
        var nTrailLength = +document.getElementById ('trailLengthList').value;

        if (nTrailLength < 0)
        {
            _DrawTrail = false;
            _TrailPoints = [];

            // redraw the screen any previous trails are removed...
            drawScreen ();
        }
        else
        {
            _DrawTrail = true;
            _nTrailLength = nTrailLength;
        }
    }


    //	
    // register all the callbacks...
    //
    document.getElementById ('StartBtn').addEventListener ('click', OnStartButtonClick);
    document.getElementById ('ResetBtn').addEventListener ('click', OnResetButtonClick);

    document.getElementById ('initAngleSlider').addEventListener ('change', OnInitAngleSliderChange);
    document.getElementById ('initAngleSlider').addEventListener ('input', OnInitAngleSliderChange);

    document.getElementById ('initSpeedSlider').addEventListener ('change', OnInitSpeedSliderChange);
    document.getElementById ('initSpeedSlider').addEventListener ('input', OnInitSpeedSliderChange);

    document.getElementById ('lengthSlider').addEventListener ('change', OnLengthSliderChange);
    document.getElementById ('lengthSlider').addEventListener ('input', OnLengthSliderChange);

    document.getElementById ('massSlider').addEventListener ('change', OnMassSliderChange);
    document.getElementById ('massSlider').addEventListener ('input', OnMassSliderChange);

    document.getElementById ('springConstSlider').addEventListener ('change', OnKSliderChange);
    document.getElementById ('springConstSlider').addEventListener ('input', OnKSliderChange);

    document.getElementById ('damping1Slider').addEventListener ('change', OnDamping1SliderChange);
    document.getElementById ('damping1Slider').addEventListener ('input', OnDamping1SliderChange);

    document.getElementById ('damping2Slider').addEventListener ('change', OnDamping2SliderChange);
    document.getElementById ('damping2Slider').addEventListener ('input', OnDamping2SliderChange);

    document.getElementById ('gravitySlider').addEventListener ('change', OnGravitySliderChange);
    document.getElementById ('gravitySlider').addEventListener ('input', OnGravitySliderChange);

    document.getElementById ('trailLengthList').addEventListener ('change', OnTrailLengthListChange);



    var theCanvas = document.getElementById ('canvasSimArea');
    var context   = theCanvas.getContext ('2d');

    var _dMaxLength = theCanvas.height - 6 * (theCanvas.height/25);
 
    const DEFAULT_INITANGLE          = 45 / 180 * Math.PI;
    const DEFAULT_INITSPEED          = 0.0;
    const DEFAULT_MASS               = 1.0;
    const DEFAULT_LENGTH             = 0.5 * _dMaxLength;
    const DEFAULT_KCONST             = 10.0;
    const DEFAULT_PENDDAMPINGCONST   = 0.03;
    const DEFAULT_SPRINGDAMPINGCONST = 0.02;
    const DEFAULT_GRAVITYCONST       = 9.8;

    const SIM_STATE_STOP             = 1;
    const SIM_STATE_PLAY             = 2;
    const BALL_RADIUS                = 5;
    const ZERO_TOLERANCE             = 0.0001;

    var _dTheta                      = DEFAULT_INITANGLE;
    var _dOmega                      = DEFAULT_INITSPEED;
    var _dMass                       = DEFAULT_MASS;
    var _dLength                     = DEFAULT_LENGTH;
    var _dSpringSpeed                = DEFAULT_INITSPEED;
    var _dSpringLength               = 0.2 * DEFAULT_LENGTH;

    var _dKConst                     = DEFAULT_KCONST;
    var _dPendulumDampingConst       = DEFAULT_PENDDAMPINGCONST;
    var _dSpringDampingConst         = DEFAULT_SPRINGDAMPINGCONST;
    var _dGravityConst               = DEFAULT_GRAVITYCONST;

    var _dTimeStep                   = 0.15;
    var _SimState                    = SIM_STATE_STOP;
    var _SimTimerId                  = 0;

    var _dPrevXPos                   = -999;
    var _dPrevYPos                   = -999;
    var _dCurrXPos                   = (_dLength + _dSpringLength) * Math.sin (_dTheta);
    var _dCurrYPos                   = (_dLength + _dSpringLength) * Math.cos (_dTheta);
    var _dPrevTheta                  = 999;
    
    var _TrailPoints                 = [];
    var _DrawTrail                   = false;
    var _nTrailLength                = 100;


    SetParamsValues (true);
    drawScreen ();
}



