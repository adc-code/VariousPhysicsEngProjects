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

            if ( Math.abs (_dPrevTheta - _dTheta) < ZERO_TOLERANCE )
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
    // thetaDot: first of the simplified equations
    //
    function thetaDot (iTheta, iOmega)
    {
        return iOmega;
    }


    //
    // omegaDot: second of the simplified equations
    // 
    function omegaDot (iTheta, iOmega)
    {
        return (-1 * _dGravityConst / _dLength) * Math.sin (_dTheta) - _dDampingConst * iOmega;
    }


    //
    // RK_SolveTheta: 4th order Runge Kutta solution for theta using the simplified equation
    //
    function RK_SolveTheta (iTheta, iOmega)
    {
        var k1, k2, k3, k4;   

        k1 = thetaDot (iTheta, iOmega);
        k2 = thetaDot (iTheta + 0.5 * _dTimeStep * k1, iOmega + 0.5 * _dTimeStep * k1);
        k3 = thetaDot (iTheta + 0.5 * _dTimeStep * k2, iOmega + 0.5 * _dTimeStep * k2);
        k4 = thetaDot (iTheta +       _dTimeStep * k3, iOmega +       _dTimeStep * k3);

        return iTheta + (_dTimeStep / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4);
    }


    //
    // RK_SolveOmega: 4th order Runge Kutta solution for omega using the simplified equation
    //
    function RK_SolveOmega (iTheta, iOmega)
    {
        var k1, k2, k3, k4;   

        k1 = omegaDot (iTheta, iOmega);
        k2 = omegaDot (iTheta + 0.5 * _dTimeStep * k1, iOmega + 0.5 * _dTimeStep * k1);
        k3 = omegaDot (iTheta + 0.5 * _dTimeStep * k2, iOmega + 0.5 * _dTimeStep * k2);
        k4 = omegaDot (iTheta +       _dTimeStep * k3, iOmega +       _dTimeStep * k3);

        return iOmega + (_dTimeStep / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4);    
    }
	

    //
    // update: updates the positions for all the balls
    //
    function updateCalcs ()
    {
        _dPrevTheta = _dTheta;

        _dOmega = RK_SolveOmega (_dTheta, _dOmega);
        _dTheta = RK_SolveTheta (_dTheta, _dOmega);

        // uncomment for debugging
        // console.log (_dOmega, _dTheta);
    }


    //
    // render: used to draw the elements to the canvas
    //
    function redrawSceen () 
    {
        var cnvsWidth  = theCanvas.width;
        var cnvsHeight = theCanvas.height;

        var boxWidth  = cnvsWidth / 5;
        var boxHeight = cnvsHeight / 25;

        var xPos = _dLength * Math.sin (_dTheta);
        var yPos = _dLength * Math.cos (_dTheta);

        var xOrigin = cnvsWidth/2;
        var yOrigin = boxHeight*3;
        
        context.fillStyle = '#666666';
        context.fillRect ((cnvsWidth - boxWidth) / 2, boxHeight  * 2, boxWidth, boxHeight);

        context.beginPath();
        context.moveTo (xOrigin, yOrigin);
        context.lineTo (xOrigin + xPos, yOrigin + yPos);
        context.stroke ();

        context.fillStyle = '#cccccc';
        context.beginPath ();
        context.arc (xOrigin, yOrigin, BALL_RADIUS, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        context.fillStyle = '#99e6ff';
        context.beginPath ();
        context.arc (xOrigin + xPos, yOrigin + yPos, BALL_RADIUS, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();
    }

	
    var theCanvas = document.getElementById ('canvasSimArea');
    var context   = theCanvas.getContext ('2d');

    var _dMaxLength = theCanvas.height - 6 * (theCanvas.height/25);
 
    const DEFAULT_INITANGLE    = 30 / 180 * Math.PI;
    const DEFAULT_INITSPEED    = 0.0;
    const DEFAULT_LENGTH       = 0.75 * _dMaxLength;
    const DEFAULT_DAMPINGCONST = 0.03;
    const DEFAULT_GRAVITYCONST = 9.8;

    const SIM_STATE_STOP       = 1;
    const SIM_STATE_PLAY       = 2;
    const BALL_RADIUS          = 5;
    const ZERO_TOLERANCE       = 0.000001;

    var _dTheta        = DEFAULT_INITANGLE;
    var _dOmega        = DEFAULT_INITSPEED;
    var _dDampingConst = DEFAULT_DAMPINGCONST;
    var _dGravityConst = DEFAULT_GRAVITYCONST;
    var _dLength       = DEFAULT_LENGTH;

    var _dTimeStep  = 0.5;
    var _dPrevTheta = 999;
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

        document.getElementById ('initSpeedSlider').disabled  = iState;
        document.getElementById ('initSpeedTextBox').disabled = iState;
        document.getElementById ('initAngleSlider').disabled  = iState;
        document.getElementById ('initAngleTextBox').disabled = iState;
        document.getElementById ('lengthSlider').disabled     = iState;
        document.getElementById ('lengthTextBox').disabled    = iState;
        document.getElementById ('dampingSlider').disabled    = iState;
        document.getElementById ('dampingTextBox').disabled   = iState;
        document.getElementById ('gravitySlider').disabled    = iState;
        document.getElementById ('gravityTextBox').disabled   = iState;
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

    function SetParamsValues (iUseDefaults)
    {
        if (iUseDefaults == true)
        {
            // First the variables...
            _dTheta        = DEFAULT_INITANGLE;
            _dOmega        = DEFAULT_INITSPEED;
            _dDampingConst = DEFAULT_DAMPINGCONST;
            _dGravityConst = DEFAULT_GRAVITYCONST;
            _dLength       = DEFAULT_LENGTH;
        }
 
        _dPrevTheta    = 999;

        // Then the UI elements...
        document.getElementById ('initSpeedSlider').value  = _dOmega;
        document.getElementById ('initSpeedTextBox').value = (_dOmega * 180 / Math.PI).toFixed (1);
        document.getElementById ('initAngleSlider').value  = _dTheta * 180 / Math.PI;
        document.getElementById ('initAngleTextBox').value = (_dTheta * 180 / Math.PI).toFixed (1) + '°';
        document.getElementById ('lengthSlider').value     = _dLength * 100 / _dMaxLength;
        document.getElementById ('lengthTextBox').value    = (_dLength * 100 / _dMaxLength).toFixed (0);
        document.getElementById ('dampingSlider').value    = _dDampingConst;
        document.getElementById ('dampingTextBox').value   = _dDampingConst;
        document.getElementById ('gravitySlider').value    = _dGravityConst;
        document.getElementById ('gravityTextBox').value   = _dGravityConst;

        document.getElementById ('ResetBtn').disabled      = false; 
    }


    //
    // OnResetButtonClick: callback to handle the start/top button
    //
    function OnResetButtonClick ()
    {
        if (document.getElementById ('ResetBtn').disabled == false)
        {
            SetParamsValues (true);
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

        drawScreen ();
    }


    //
    // OnLengthSliderChange: callback to handle changes with the length slider
    //
    function OnLengthSliderChange ()
    {
        var dLengthPercent = document.getElementById ('lengthSlider').value;
        _dLength = _dMaxLength * dLengthPercent * 0.01;

        document.getElementById ('lengthTextBox').value = dLengthPercent;

        drawScreen ();
    }


    //
    // OnDampingSliderChange: callback to handle changes with the dampling slider
    //
    function OnDampingSliderChange ()
    {
        _dDampingConst = document.getElementById ('dampingSlider').value;
        document.getElementById ('dampingTextBox').value = _dDampingConst;
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
    document.getElementById ('dampingSlider').addEventListener ('change', OnDampingSliderChange);
    document.getElementById ('dampingSlider').addEventListener ('input', OnDampingSliderChange);
    document.getElementById ('gravitySlider').addEventListener ('change', OnGravitySliderChange);
    document.getElementById ('gravitySlider').addEventListener ('input', OnGravitySliderChange);

    SetParamsValues (true);
    drawScreen ();
}



