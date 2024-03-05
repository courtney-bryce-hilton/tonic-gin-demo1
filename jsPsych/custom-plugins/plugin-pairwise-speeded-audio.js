const jsPsychPairwiseAudio2 = (function (jspsych) {
    'use strict';

    const info = {
        name: "pairwise-audio2",
        parameters: {
            stimulus: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: "Stimulus",
                default: undefined,
            },
            probe1: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: "Probe 1",
                default: undefined,
            },
            probe2: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: "Probe 2",
                default: undefined,
            },
            prompt1: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Prompt1",
                default: null,
            },
            prompt2: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Prompt2",
                default: null,
            },
            tile_colours: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Tile colours",
                default: ["blue", "yellow"],
            },
            button_label: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Button label",
                default: "Submit",
            },
            song_image: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Song Image",
                default: null,
            },
            probe_image: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Probe Image",
                default: null,
            },
            /** Sets the minimum value of the slider. */
            min: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Min slider",
                default: 0,
            },
            /** Sets the maximum value of the slider */
            max: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Max slider",
                default: 100,
            },
            /** Sets the starting value of the slider */
            slider_start: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Slider starting value",
                default: 50,
            },
            /** Sets the step of the slider */
            step: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Step",
                default: 1,
            },
            /** If true, the participant will have to move the slider before continuing. */
            require_movement: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Require movement",
                default: false,
            },
            /** Array containing the labels for the slider. Labels will be displayed at equidistant locations along the slider. */
            labels: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Labels",
                default: [],
                array: true,
            },
            /** Width of the slider in pixels. */
            slider_width: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Slider width",
                default: null,
            },
            include_slider: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Include Slider",
                default: true,
            },
            include_clock: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Include Clock",
                default: true,
            },
            include_score: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Include Score",
                default: true,
            },
        },
    };
    /**
     * **pairwise-audio**
     *
     * jsPsych plugin specifically created for the 'Tonic' experiment.
     * It allows playing the participant two tone-probe stimuli consecutively
     * And then prompting a comparison response, reflecting both in a 
     * binary choice and in a likert rated magnitude.
     *
     * @author Courtney Hilton
     */
    class PairwiseAudio2Plugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {
            let html = "";
            let trial_data = {};
            let tileResponseEnabled = false;
            let tile_rt, tileResponse, sliderResponse, pointsTotal, streak;
            let points = 0;
            const randomPercent = Math.floor(Math.random() * (95 - 35)) + 35; // random filler value while testing


            // ------------- //
            // 1. CSS styles //
            // ------------- //


            // inject CSS for trial
            html += '<style id="jspsych-pairwise-audio-css">';
            // CSS for tile animations
            html += '@keyframes wiggle { 0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } 100% { transform: translateX(0); }}' +
                    '.wiggle { animation: wiggle 0.7s ease-in-out; animation-iteration-count: 1;}';
            html += '@keyframes rock { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); }}' +
                    '.rock { animation: rock 1s ease-in-out infinite; }';
            // other layout CSS
            html += '#jspsych-comparison-audio-container { display: flex; justify-content: center; align-items: center; }' +
                    '.jspsych-audio-tile { border: 1px solid black; width: 10vh; height: 10vh; display: flex; justify-content: center; align-items: center; text-align: center; }' +
                    '.jspsych-tile-container { display: flex; margin: 0 10px; transition: all 0.3s ease; user-select: none; flex-direction: column; position: relative; }' +
                    '.selectedTile { box-shadow: 0 0 10px 7px red; opacity: 1 !important; }';
            // set the colours of the tiles
            html += `#tile1 { background-color: ${trial.tile_colours[0]}; }` +
                    `#tile2 { background-color: ${trial.tile_colours[1]}; }`;
            // s
            html +=
                "#feedbackTile { display: none; }" + 
                "#jspsych-viz-container { display: none; }" + 
                "#jspsych-pairwise-audio-next { display: none; }" +
                "#jspsych-audio-slider-response-wrapper { display: none; }";

            // styles for the slider and its animations
            html += `
            @keyframes wiggle2 {
                0%, 100% {
                  transform: translateX(0);
                }
                25% {
                  transform: translateX(-5px);
                }
                50% {
                  transform: translateX(5px);
                }
                75% {
                  transform: translateX(-5px);
                }
              }

              .wiggle2 { animation: wiggle2 0.5s ease-in-out forwards; }

            
            /* slider track before the thumb */
            .jspsych-slider::-webkit-slider-runnable-track {
                width: 100%;
                height: 8.4px;
                cursor: pointer;
                animate: 0.2s;
                box-shadow: 1px 1px 1px #000000;
                background: linear-gradient(
                    to right,
                    var(--track-fill-colour) 0% var(--first-transition),
                    var(--colour-before-mid) var(--first-transition) var(--midpoint-percentage),
                    var(--colour-after-mid) var(--midpoint-percentage) var(--second-transition),
                    var(--track-fill-colour) var(--second-transition) 100%
                );
                border-radius: 1.3px;
                border: 0.2px solid #010101;
            }
            

            /* slider thumb */
            .jspsych-slider::-webkit-slider-thumb {
                box-shadow: 1px 1px 1px #000000;
                border: 1px solid #000000;
                height: 36px;
                width: 16px;
                border-radius: 3px;
                background: #000000;
                cursor: pointer;
                -webkit-appearance: none;
                margin-top: -14px;
            }

            .jspsych-slider::-moz-range-thumb {
                box-shadow: 1px 1px 1px #000000;
                border: 1px solid #000000;
                height: 36px;
                width: 16px;
                border-radius: 3px;
                background: #000000;
                cursor: pointer;
                -webkit-appearance: none;
                margin-top: -14px;
            }

            .jspsych-slider:focus::-webkit-slider-runnable-track {
                background: #C0C0C0;
            }

            .jspsych-slider:active::-webkit-slider-thumb {
                background: #000000;
            }

            #score-container {
                position: fixed;
                top: 10vh;
                left: 10vh;
                text-align: left;
            }

            `;

            html += `

            .child-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 20px; /* space between tiles and sliders */
            }

            #jspsych-audio-slider-response-wrapper {
                flex-grow: 0;
                flex-basis: 0%;     
                opacity: 0;        
                display: flex; 
                overflow: hidden; 
                transition: flex-basis 1s ease, opacity 1s ease;
                white-space: nowrap;
                align-items: center; 
                justify-content: center; 
            }
            
            #jspsych-audio-slider-response-wrapper.expanded {
                flex-grow: 1;
                flex-basis: 50%;
                opacity: 1; 
                overflow: visible;
            }
            
            

            .center .jspsych-audio-slider-response-container {
                min-width: 20vw;
                height: 20px;
                position: relative; /* center alignment handled by flex properties of the parent */
            }

            .replay-btn {
                width: 10vh;
                height: 3vh;
                font-size: 0.8em;
                margin-bottom: 10px;
                display: none;
            }

            .center {
                display: flex;
                flex-direction: column;
                justify-content: center;
                height: 6vh; /* Ensure this is tall enough to align with the .red-square centers */
            }

            .center .jspsych-audio-slider-response-container {
                margin-top: calc(3vh + 10px - 3vh - 0.7em); /* 3vh: half the height of the audio tiles, 10px: half the height of the blue rectangle, -3vh: top-margin of percentage; -0.7em half percentage font height */
            }

            .tile-label {
                font-size: 2em;
            }

            .jspsych-audio-slider-response-container {
                position: relative; /* this is needed to position the pseudo-element for the midway point marking */
            }

            /* adding a mid-way line on the slider */
            .jspsych-audio-slider-response-container::after {
                content: '';
                position: absolute;
                left: 50%; 
                top: 0;
                bottom: 0;
                width: 2px;
                background-color: black;
            }
            
            `;

            html += `
            #feedback-container {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: auto;
            }

            #countdown-timer {
                width: 4em;
            }
            
            #countdown-number {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.5em;
                color: white;
            }

            .tile-percent {
                margin-top: 2vh;
                font-size: 1.4em;
            }
            
            `;
            // html += '#slider-value-display { background-color: transparent; position: absolute; bottom: 150%; user-select: none; padding: 2px 5px; opacity: 0.5; font-size: 0.8em; }';
            html += ".sliderLabels { padding-top: 20px; }"

            if (!trial.include_score) {
                html += '#score-container { display: none; }';
            }
            // close CSS
            html += "</style>";


            // ------------- //
            // 2. build HTML //
            // ------------- //

            // add a container for all the tiles plus the annotations
            html += '<div id="jspsych-triplet-audio-bigContainer">';


            html += `<div id="score-container">
            <b>Score:</b><br>
            <b>Streak:</b>
            </div>`;

            // show animated characters accompanying audio clips
            if (trial.song_image !== null) {
                html += '<div id="musicAnimation"></div>' + 
                        '<br>';
            }

            // show preamble text
            if (trial.prompt1 !== null) {
                html +=
                    '<div id="jspsych-triplet-audio-sort-preamble" class="jspsych-triplet-audio-sort-preamble">' +
                    trial.prompt1 +
                    '</div>' +
                    '<br>';
            }

            // add a container for all the tiles
            html += '<div id="jspsych-comparison-audio-container">';

            // tile 1
            html += `
                <div class="jspsych-tile-container child-container">
                    <button id="replay-audio-btn1" class="replay-btn" type="button">Replay</button>
                    <div class="jspsych-audio-tile" id="tile1"><p class="tile-label">F</p></div>
                    <div class="tile-percent" id="tile-percent1" style="display: none;">50%</div>
                </div>
            `;

            const half_thumb_width = 7.5;

            html += '<div id="jspsych-audio-slider-response-wrapper" class="child-container center" style="margin: 100px 0px;">';
            html +=
                '<div class="jspsych-audio-slider-response-container" style="width:';
            if (trial.slider_width !== null) {
                html += trial.slider_width + "px;";
            }
            else {
                html += "auto;";
            }
            html += '">';
            html +=
                '<input type="range" class="jspsych-slider" value="' +
                trial.slider_start +
                '" min="' +
                trial.min +
                '" max="' +
                trial.max +
                '" step="' +
                trial.step +
                '" id="jspsych-audio-slider-response-response"';
            html += "></input>"
            html += "<div>";
            for (let j = 0; j < trial.labels.length; j++) {
                const label_width_perc = 100 / (trial.labels.length - 1);
                const percent_of_range = j * (100 / (trial.labels.length - 1));
                const percent_dist_from_center = ((percent_of_range - 50) / 50) * 100;
                const offset = (percent_dist_from_center * half_thumb_width) / 100;
                html +=
                    '<div style="border: 1px solid transparent; display: inline-block; position: absolute; ' +
                    "left:calc(" +
                    percent_of_range +
                    "% - (" +
                    label_width_perc +
                    "% / 2) - " +
                    offset +
                    "px); text-align: center; width: " +
                    label_width_perc +
                    '%;">';
                html += '<div style="text-align: center; font-size: 80%;" class="sliderLabels">' + trial.labels[j] + "</div>";
                html += "</div>";
            }
            html += "</div>";
            html += "</div>"; // close jspsych-audio-slider-response-container
            html += "</div>"; // close jspsych-audio-slider-response-wrapper


            // tile 2
            html += `
                <div class="jspsych-tile-container child-container">
                    <button id="replay-audio-btn2" class="replay-btn" type="button">Replay</button>
                    <div class="jspsych-audio-tile" id="tile2"><p class="tile-label">J</p></div>
                    <div class="tile-percent" id="tile-percent2" style="display: none;">50%</div>
                </div>
            `;

            html += '</div>'; // closing the container for all the tiles

            
            // adding chart
            html += '<div id="jspsych-viz-container">' + 
                '<br>---<br><br>' +
                '<div id="feedbackAnnotation"></div>' +
                '<canvas id="vizCanvas" width="45vw" height="30vh"></canvas>' + 
                '</div>';
            
            html += '</div>'; // closing the big main container

            html += '<br>';

            // add countdown timer
            html += `<div id="feedback-container">
                <canvas id="countdown-timer" width="100" height="100"></canvas>
                <span id="countdown-number">3</span>
            </div>`;
            
            // add submit button
            html += `<button type="button" id="jspsych-pairwise-audio-submit" class="jspsych-btn">${trial.button_label}</button>`;

            // add next button
            html += `<button type="button" id="jspsych-pairwise-audio-next" class="jspsych-btn">Next</button>`;

            display_element.innerHTML = html;

            // disable submit button (until all trials have been played at least once)
            document.querySelector("#jspsych-pairwise-audio-submit").style.display = 'none';

            // make sure all opacities are normal
            document.querySelectorAll('.jspsych-audio-tile').forEach(tile => {
                tile.style.opacity = '1';
            });


            // ------------- //
            // 3. animations //
            // ------------- //

            // ------ ANIMATIONS FOR COUNTDOWN TIMER ------ // 

            // draw circle in a canvas
            function drawCountdownCircle(canvas, pct) {
                const ctx = canvas.getContext('2d');
                const size = canvas.width;
                const x = size / 2;
                const y = size / 2;
                const radius = size / 2;
                const startAngle = -0.5 * Math.PI; // (starting from the top)
                const endAngle = (2 * pct * Math.PI) - 0.5 * Math.PI; // (full circle)
            
                // clear canvas
                ctx.clearRect(0, 0, size, size);
            
                // draw background circle
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'black';
                ctx.fill();
            
                // draw countdown circle
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.arc(x, y, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = '#b3b0a6';
                ctx.fill();
            }
            
            // animate the text during the countdown
            //      totalDuration: total duration of countdown
            //      startNumber: number of points it starts with
            //      endNumber: minimum number of points it ends at
            function startCanvasCountdown(totalDuration, startNumber, endNumber) {
                const canvas = document.getElementById('countdown-timer');
                const countdownNumber = document.getElementById('countdown-number');
                let startTime = Date.now();
                let endTime = startTime + totalDuration;
                let numberRange = startNumber - endNumber;
            
                function update() {
                    let now = Date.now();
                    let elapsed = now - startTime;
                    let remaining = endTime - now;
                    let pct = elapsed / totalDuration;
                    let currentNumber = startNumber - Math.floor((elapsed / totalDuration) * numberRange);
            
                    // Make sure countdown stops at endNumber
                    if (currentNumber < endNumber) {
                        currentNumber = endNumber;
                    }
            
                    // Update the countdown number
                    countdownNumber.textContent = currentNumber;
            
                    // Update the countdown circle
                    drawCountdownCircle(canvas, pct);
            
                    if (remaining > 0) {
                        requestAnimationFrame(update);
                    }
                }
            
                requestAnimationFrame(update);
            }
            
            // function to calculate the number of points participant gets based on their RT
            function calculatePoints(responseTime) {
                const maxTime = 3000;
                const minPoints = 10;
                const maxPoints = 100;
                const range = maxPoints - minPoints;
            
                // if response time is 3000ms or more, return minimum points
                if (responseTime >= maxTime) {
                    return minPoints;
                }
            
                // calculate the points awarded
                let pointsAwarded = ((maxTime - responseTime) / maxTime) * range + minPoints;
                pointsAwarded = (randomPercent < 50) ? -pointsAwarded : pointsAwarded;
                return Math.round(pointsAwarded); // round to nearest integer
            }

            // function calculateAccuracy(selectedPercent) {
            //     return ((selectedPercent <= 50) ? 0 : 1)
            // }

            function toggleSliderResponse() {
                if (trial.include_slider) {
                    // make tiles smaller
                    document.querySelectorAll('.jspsych-audio-tile').forEach((tile) => {
                        tile.style.height = '6vh';
                        tile.style.width = '6vh';
                    });

                    // make replay buttons right size and make visible
                    document.querySelectorAll('.replay-btn').forEach((tile) => {
                        tile.style.width = '6vh';
                        tile.style.display = 'block';
                    });

                    // show percentage text below each tile
                    document.querySelectorAll('.tile-percent').forEach((tile) => {
                        tile.style.display = "block";
                    });

                    document.getElementById('musicAnimation').style.display = "none";

                    // remove previous glow class
                    // document.querySelectorAll('.jspsych-audio-tile').forEach(otherTile => {
                    //     otherTile.classList.remove('selectedTile');
                    // });

                    // update the prompt text
                    document.querySelector('#jspsych-triplet-audio-sort-preamble').innerHTML = trial.prompt2;

                    // enable submit button
                    document.querySelector("#jspsych-pairwise-audio-submit").style.display = 'inline-block';


                    const middle = document.getElementById('jspsych-audio-slider-response-wrapper');
                    if (middle.classList.contains('expanded')) {
                        middle.classList.remove('expanded');
                    } else {
                        middle.classList.add('expanded');
                    }
                } else {
                    // skip the slider response page
                    document.querySelector('#jspsych-pairwise-audio-submit').click();
                }
            }

            function updateScore() {
                // update total points
                const pointsTrials = jsPsych.data.get().trials.filter(trials => trials.points !== undefined);
                let pointsArray
                if (pointsTrials.length > 0) {
                    pointsArray = pointsTrials.map(trials => trials.points);
                    pointsTotal = pointsArray.reduce((total, trialPoints) => total + trialPoints, 0) + points;

                    streak = pointsArray.map(num => Math.sign(num)).reduce((acc, curr) => acc + curr, 0);

                    if (points > 0) {
                        streak += 1;
                    } else if (points < 0) {
                        streak = 0;
                    }
                } else {
                    // initialise pointsTotal and streak
                    pointsTotal = 0 + points;
                    streak = 0;

                    if (points > 0) {
                        streak += 1;
                    }
                }

                if (streak < 0) { streak = 0; }

                document.querySelector('#score-container').innerHTML = `
                <b>Score:</b> ${pointsTotal}<br><br>
                <b>Streak:</b> ${streak}
                `
            }

            // initialise
            updateScore();

            // ------ PHASE 1: tile response ------ // 
            function selectTileResponse(tileNumber) {
                if (tileResponseEnabled) {
                    // save RT for selecting tile
                    tile_rt = Math.round(performance.now() - startTimeTile);

                    // save selected tile response
                    // tileResponse = event.currentTarget.textContent;

                    // remove response event listeners
                    // document.querySelectorAll('.jspsych-audio-tile').forEach(tile => {
                    //     tile.removeEventListener('click', selectTileResponse);
                    // });

                    tileResponse = tileNumber;

                    // test
                    document.removeEventListener('keydown', tile1Listener);
                    document.removeEventListener('keydown', tile2Listener);

                    // remove 'selectedTile' class from all tiles (kinda redudant, but just making sure)
                    document.querySelectorAll('.jspsych-audio-tile').forEach(otherTile => {
                        otherTile.classList.remove('selectedTile');
                    });
            
                    // apply to selected tile
                    document.querySelector(`#tile${tileResponse}`).classList.toggle('selectedTile');
                    // event.currentTarget.classList.toggle('selectedTile');

                    // calculate points for the current trial
                    points = calculatePoints(tile_rt);
                    const feedbackMessage = (points > 0) ? `+${points}` : points;

                    updateScore();

                    const feedbackContainer = document.getElementById('feedback-container');

                    if (trial.include_clock) {
                        // show participant their points from the trial
                        feedbackContainer.innerHTML = feedbackMessage;
                        feedbackContainer.style.fontSize = '2em';
                        if (points > 0) {
                            feedbackContainer.style.color = "green";
                        } else {
                            feedbackContainer.style.color = "red";
                        }
                    }

                    // move on to phase 2 of trial after 1 second
                    setTimeout(() => {
                        feedbackContainer.style.display = 'none'; // hide feedback
                        toggleSliderResponse(); // progress to slider rating phase
                        startTimeSlider = performance.now(); // start tracking time for slider response
                    }, 2000); 
                }
            }

            function selectTile(keys, tile) {
                return function(event) {
                    if (event.key === keys[0] || event.key === keys[1]) {
                        selectTileResponse(tile);
                    }
                };
            }
            const tile1Listener = selectTile(['f', 'F'], '1');
            const tile2Listener = selectTile(['j', 'J'], '2');

            document.addEventListener('keydown', tile1Listener);
            document.addEventListener('keydown', tile2Listener);

            // add response event listeners
            // document.querySelectorAll('.jspsych-audio-tile').forEach(tile => {
            //     tile.addEventListener('click', selectTileResponse);
            // });

            // ------ ANIMATIONS FOR COLOUR FILL ON SLIDER ------ // 
            // get the slider element
            const slider = display_element.querySelector('#jspsych-audio-slider-response-response');

            // function to update the slider fill
            function updateSliderFill() {
                // calculate the fill percentage
                const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
                // update the slider to the new percentage
                slider.style.setProperty('--fill-percentage', `${value}%`);
                // this is an annoying workaround for now...
                // the fill only applies when the slider looses focus when using mouse input
                // so applying 'blur' forces it to loose focus...
                slider.blur();
            }

            // attach the event listener to update fill on input
            slider.addEventListener('input', updateSliderFill);
            slider.addEventListener('change', updateSliderFill);
            slider.classList.add('wiggle2');


            // ------ ANIMATIONS FOR SLIDER ANNOTATION ------ // 
            function updateValueDisplay(slider) {
                // update display content
                // displayElement.textContent = slider.value;
            
                // calculate position for the annotation
                const sliderWidth = slider.offsetWidth;
                const thumbWidth = 16; // this is defined in the CSS above (KEEP SYNCED)
                const value = parseFloat(slider.value);
                const min = parseFloat(slider.min || -5);
                const max = parseFloat(slider.max || 5);
                const relativePosition = (value - min) / (max - min);
            
                // Determine the color fill percentage (50% being the midpoint of the slider)
                const trackColor = '#C0C0C0';
                const fillPercentage = relativePosition * 100;
                const midPointPercentage = ((0 - min) / (max - min)) * 100;

                let firstTransition, secondTransition, colourBeforeMid, colourAfterMid;
                if (value < 0) {
                    colourBeforeMid = 'blue';
                    colourAfterMid = trackColor;
                    firstTransition = Math.round(fillPercentage);
                    secondTransition = midPointPercentage;
                } else {
                    colourBeforeMid = trackColor;
                    colourAfterMid = 'yellow';
                    firstTransition = midPointPercentage;
                    secondTransition = Math.round(fillPercentage);
                }

                // Update the CSS variables for the track
                slider.style.setProperty('--track-fill-colour', trackColor);
                slider.style.setProperty('--first-transition', `${firstTransition}%`);
                slider.style.setProperty('--second-transition', `${secondTransition}%`);
                slider.style.setProperty('--midpoint-percentage', `${midPointPercentage}%`);
                slider.style.setProperty('--colour-before-mid', colourBeforeMid);
                slider.style.setProperty('--colour-after-mid', colourAfterMid);
                
            
                // adjust `thumbOffset` to center the value display over the thumb
                // subtract half the thumb width to center
                // const thumbOffset = (relativePosition * (sliderWidth - thumbWidth)) + (thumbWidth / 2);
            
                // displayElement.style.left = `${thumbOffset}px`;
            
                // adjust this transform to center the display element if it has a variable width
                // displayElement.style.transform = 'translateX(-50%)'; // center it above the thumb

                let tile1_percent, tile2_percent;
                if (value < 0) {
                    tile1_percent = 50 + -value;
                    tile2_percent = 100 - tile1_percent;
                } else if (value > 0) {
                    tile2_percent = 50 + value;
                    tile1_percent = 100 - tile2_percent;
                } else if (value === 0) {
                    tile1_percent = 50;
                    tile2_percent = 50;
                }

                document.querySelector("#tile-percent1").innerHTML = `${tile1_percent}%`;
                document.querySelector("#tile-percent2").innerHTML = `${tile2_percent}%`;

            }

            function sliderUpdater() {
                return updateValueDisplay(slider);
            }
            
            slider.addEventListener('input', sliderUpdater);

            // initialise
            updateValueDisplay(slider);


            // ------------------------------ //
            // 4. stimulus playback functions //
            // ------------------------------ //

            
            // tracking all audio sources so they can be stopped at the end of the trial
            let activeAudioSources = [];
            // tracking whether to end current probe sequence (e.g., when response is made)
            let endCurrentSequence = false;
            // tracks the number of times the participant replays each probe
            let replay_probe = [0, 0];

            function playAudio(audioContext, audioSource, this_, changeFlagAtStart, startTimeOffset = 0) {
                return new Promise((resolve, reject) => {
                    this_.jsPsych.pluginAPI.getAudioBuffer(audioSource)
                        .then((buffer) => {
                            if (audioContext !== null) {
                                this_.audio = audioContext.createBufferSource();
                                this_.audio.buffer = buffer;
                                this_.audio.connect(audioContext.destination);
                                const startTime = audioContext.currentTime;
                                this_.audio.start(startTime, startTimeOffset);
                                if (changeFlagAtStart) { changeFlagAtStart(); }
                                this_.audio.onended = () => {
                                    resolve();
                                    activeAudioSources = activeAudioSources.filter(src => src !== this_.audio);
                                };
                                activeAudioSources.push(this_.audio);
                            } else {
                                reject("Error: Audio context is null.");
                            }
                        })
                        .catch((error) => {
                            reject("Error playing audio: " + error);
                        });
                });
            }

            async function playSequence(melody_context, probe_context, trial, this_, probe, active_tile, enableResponse) {
                if (endCurrentSequence) return

                let animation = document.getElementById('musicAnimation');
                animation.style.opacity = 1;

                animation.innerHTML = `<img src="${trial.song_image}" id="song-image" style='width: 100px; height: 100px;'>`;
                animation.classList.add('rock');

                // fade-out non-active tile
                display_element.querySelector(`#tile${active_tile == 1 ? 2 : 1}`).style.opacity = '0.4';

                // play the melody then the probe in sequence
                await playAudio(melody_context, trial.stimulus, this_, null);
                if (!endCurrentSequence) {
                    document.getElementById('musicAnimation').innerHTML =`<img src="${trial.probe_image}" id="song-image" style='width: 100px; height: 100px;'>`;
                    animation.classList.remove('rock');
                    animation.classList.add('wiggle');
                    await playAudio(probe_context, probe, this_, () => {
                        if (enableResponse) { 
                            tileResponseEnabled = true;
                            startTimeTile = performance.now(); // timing RT for tile response
                            // start the countdown timer
                            if (trial.include_clock) { startCanvasCountdown(3000, 100, 10) };
                        }
                    });
                    animation.addEventListener('animationend', () => {
                        animation.classList.remove('wiggle');
                    });
                    // return the non-active tile back to full opacity
                    display_element.querySelector(`#tile${active_tile == 1 ? 2 : 1}`).style.opacity = '1';
                    animation.style.opacity = 0;
                }
            }

            async function firstPlayThrough(melody_context, probe_context, trial, this_) {
                isAudioPlaying = true;
                await playSequence(melody_context, probe_context, trial, this_, trial.probe1, 1, false);
                await playSequence(melody_context, probe_context, trial, this_, trial.probe2, 2, true);
                isAudioPlaying = false;

                // enable the 'submit' button once participant has made a slider response
                const sliderContainer = document.getElementById('jspsych-audio-slider-response-response');
                function enableSubmitButtonAndRemoveListener() {
                    document.querySelector("#jspsych-pairwise-audio-submit").disabled = false;
                    sliderContainer.removeEventListener('change', enableSubmitButtonAndRemoveListener);
                }
                sliderContainer.addEventListener('change', enableSubmitButtonAndRemoveListener);
            }

            async function handleReplay(melody_context, probe_context, trial, this_, probe, active_tile) {
                if (!isAudioPlaying) {
                    isAudioPlaying = true;
                    replay_probe[active_tile-1] += 1;
                    console.log(replay_probe);
                    await playSequence(melody_context, probe_context, trial, this_, probe, active_tile);
                    isAudioPlaying = false;
                }
            }


            // --------------------------- //
            // 5. play melodies and probes //
            // --------------------------- //


            const melody_context = this.jsPsych.pluginAPI.audioContext();
            const probe_context = this.jsPsych.pluginAPI.audioContext();
            let isAudioPlaying = false;

            firstPlayThrough(melody_context, probe_context, trial, this);


            // ---------------------- //
            // 5. render feedback viz //
            // ---------------------- //


            function renderChart(chartData, participant_guess) {
                display_element.querySelector('#jspsych-viz-container').style.display = 'block';

                // ---------------- //
                // Chart parameters //
                // ---------------- //
                const ctx = document.getElementById('vizCanvas').getContext('2d');
                const defaultColour = '#2a9d8f' + "90"; // colour + alpha
                // const highlightColour = '#f4a261' + "90"; // colour + alpha
                const n_bins = 11;

                // assigning user response (which has 0.1 precision) an integer bin by its index
                const participantRatingBinIdx = Math.floor(participant_guess / 10) + 5;

                // setting default colour for all bars, then changing the value user chose as different colour
                const backgroundColours = Array(n_bins).fill(defaultColour);
                // backgroundColours[participantRatingBinIdx] = highlightColour;

                // add 1 to the chosen rating
                chartData[participantRatingBinIdx] += 1;

                // calculate the maximum y value
                const actualMaxValue = Math.max(...chartData);

                // set the extended max value (actual max + 2) for the y-axis
                const extendedMaxValue = actualMaxValue + 2;

                // calculate step size for y-axis ticks
                let stepSize;
                if (extendedMaxValue <= 5) {
                    stepSize = 1; // set step size to 1 for max value of 5 or less
                } else {
                    // calculate a suitable step size for y-axis ticks for larger values
                    const numTicks = 5;
                    stepSize = Math.ceil(extendedMaxValue / numTicks);
                }

                // ------------ //
                // Create chart //
                // ------------ //

                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['', '', '', '', '', '', '', '', '', '', ''],
                        datasets: [{
                            data: chartData,
                            backgroundColor: backgroundColours,
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        layout: {
                            padding: {
                                top: 30,
                                right: 30,
                                bottom: 30,
                                left: 30
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: extendedMaxValue,
                                ticks: {
                                    stepSize: stepSize,
                                    callback: (value) => {
                                        // hide the last tick if it's equal to the extended maximum
                                        if (value === extendedMaxValue) {
                                            return null;
                                        }
                                        return value;
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false // hide the vertical gridlines
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false // disable the default legend
                            },
                            tooltip: {
                                enabled: true
                            }
                        }
                    },
                //     plugins: [{
                //         id: 'participantGuessAnnotation',
                //         afterDraw: (chart) => {
                //             const ctx = chart.ctx;
                //             ctx.save();
                //             const dataset = chart.data.datasets[0];
                //             const meta = chart.getDatasetMeta(0);
                //             const x = meta.data[participantRatingBinIdx].x;
                //             const y = meta.data[participantRatingBinIdx].y;
                //             ctx.fillStyle = 'black';
                //             ctx.font = '16px Arial';
                //             ctx.textAlign = 'center';
                //             ctx.textBaseline = 'bottom'; // align text vertically relative to the point
                //             ctx.fillText('Your rating!', x, y - 10); // position the text 10 pixels above the top of the 4th bar
                //             ctx.restore();
                //         }
                //     },
                // ]
                plugins: [{
                    id: 'participantGuessAnnotation',
                    afterDraw: (chart) => {
                        const ctx = chart.ctx;
                        ctx.save();
                        const xAxis = chart.scales.x;
                        const yAxis = chart.scales.y;
                        const x = xAxis.getPixelForValue((participant_guess / 10) + 5); 
                        const yTop = yAxis.top;
                        const yBottom = yAxis.bottom;
                        
                        // draw the vertical line annotation
                        ctx.beginPath();
                        ctx.moveTo(x, yTop);
                        ctx.lineTo(x, yBottom);
                        ctx.strokeStyle = 'red'; 
                        ctx.lineWidth = 2; 
                        ctx.stroke();
                
                        // draw the text annotation 
                        ctx.fillStyle = 'black';
                        ctx.font = '1em Arial';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
        
                        const text = 'Your guess';
                        const metrics = ctx.measureText(text);
                        const textWidth = metrics.width;
        
                        ctx.fillText(text, x - (textWidth + 10), yTop + 10);
                
                        ctx.restore();
                    }
                },
                {
                    id: 'customXAxisAnnotation',
                    afterDraw: (chart) => {
                        const ctx = chart.ctx;
                        const xAxis = chart.scales.x;
                        const yAxis = chart.scales.y;
                        const middleBinIndex = Math.floor(n_bins / 2);
                        const yBottom = yAxis.bottom;
                
                        const arrowLength = 30; 
                        const arrowWidth = 5; 
                        const squareSize = 15;  
                        const bottomOffset = -20;
                
                        ctx.save();
                
                        // draw left arrow
                        let startLeftArrowX = xAxis.getPixelForValue(middleBinIndex);
                        let endLeftArrowX = xAxis.getPixelForValue(1); // second last bin to the left
                        ctx.beginPath();
                        ctx.moveTo(startLeftArrowX, yBottom - bottomOffset); // bottomOffset is the offset from the bottom axis
                        ctx.lineTo(endLeftArrowX, yBottom - bottomOffset);
                        // arrow head
                        ctx.lineTo(endLeftArrowX + arrowLength / 2, yBottom - bottomOffset - arrowWidth);
                        ctx.moveTo(endLeftArrowX, yBottom - bottomOffset);
                        ctx.lineTo(endLeftArrowX + arrowLength / 2, yBottom - bottomOffset + arrowWidth);
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                
                        // draw right arrow
                        let startRightArrowX = xAxis.getPixelForValue(middleBinIndex);
                        let endRightArrowX = xAxis.getPixelForValue(n_bins - 2); // second last bin to the right
                        ctx.beginPath();
                        ctx.moveTo(startRightArrowX, yBottom - bottomOffset); // bottomOffset is the offset from the bottom axis
                        ctx.lineTo(endRightArrowX, yBottom - bottomOffset);
                        // arrow head
                        ctx.lineTo(endRightArrowX - arrowLength / 2, yBottom - bottomOffset - arrowWidth);
                        ctx.moveTo(endRightArrowX, yBottom - bottomOffset);
                        ctx.lineTo(endRightArrowX - arrowLength / 2, yBottom - bottomOffset + arrowWidth);
                        ctx.stroke();
                
                        // draw tiles
                        const square1X = xAxis.getPixelForValue(0) - squareSize / 2; // centering the square
                        const square2X = xAxis.getPixelForValue(n_bins - 1) - squareSize / 2; // assuming 11 bins, adjust if different
                        ctx.fillStyle = trial.tile_colours[0];
                        ctx.fillRect(square1X - 0.5, yBottom - bottomOffset - (squareSize/2), squareSize, squareSize); 
                        ctx.fillStyle = trial.tile_colours[1];
                        ctx.fillRect(square2X + 0.5, yBottom - bottomOffset - (squareSize/2), squareSize, squareSize);
                
                        ctx.restore();
                    }
                },
                {
                    id: '50PercentLine',
                    afterDraw: (chart) => {
                        const ctx = chart.ctx;
                        const xAxis = chart.scales.x;
                        const yAxis = chart.scales.y;
                        const yTop = yAxis.top;
                        const yBottom = yAxis.bottom;
                
                        const middleX = xAxis.getPixelForValue(Math.floor(n_bins / 2));
                        ctx.beginPath();
                        ctx.moveTo(middleX, yTop);
                        ctx.lineTo(middleX, yBottom);
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]); // (set dash pattern)
                        ctx.stroke();
                        ctx.setLineDash([]); // (reset dash pattern to solid for other drawing)

                        ctx.restore();
                    }
                }]
                });
            }


            // --------------------------- //
            // 6. allow replay of examples //
            // --------------------------- //


            display_element.querySelector("#replay-audio-btn1").addEventListener("click", () => {
                handleReplay(melody_context, probe_context, trial, this, trial.probe1, 1);
            });

            display_element.querySelector("#replay-audio-btn2").addEventListener("click", () => {
                handleReplay(melody_context, probe_context, trial, this, trial.probe2, 2);
            });


            // -------------------------------- //
            // 7. submit button and data saving //
            // -------------------------------- //


            const disableAudio = () => {
                // make sure all current sequences end
                endCurrentSequence = true;

                // stop all active audio sources
                activeAudioSources.forEach(audioNode => {
                    if (audioNode) {
                        audioNode.stop();
                    }
                });

                // clear the array of active audio sources
                activeAudioSources = [];

                // set audio is playing flag back to false
                isAudioPlaying = false;
            }

            // function to clean the probe/stimulus filepaths for data saving
            function extractStimulus(filepath) {
                const parts = filepath.split('/');
                const filenameWithExtension = parts.pop();
                const filenameWithoutExtension = filenameWithExtension.split('.').slice(0, -1).join('.');
                return filenameWithoutExtension;
            }

            function generateNormalDistArray(mean = 5, std = 1.5, arrayLength = 11, targetSum = 20) {
                // Box-Muller transform for normal distribution
                const generateNormal = (mean, std) => {
                    let u = 0, v = 0;
                    while (u === 0) u = Math.random();
                    while (v === 0) v = Math.random();
                    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
                    return z * std + mean;
                };
            
                // initialize array and variables for generating the distribution
                let arr = new Array(arrayLength).fill(0);
                let total = 0;
                const attempts = 100; // number of values to generate to simulate the distribution
            
                // generate values and accumulate in the array
                for (let i = 0; i < attempts; i++) {
                    let num = generateNormal(mean, std);
                    let index = Math.round(num);
                    if (index >= 0 && index < arrayLength) {
                        arr[index] += 1;
                        total += 1;
                    }
                }
            
                // normalize the array to sum to approximately the targetSum
                // and ensure distribution across multiple positions
                const scaleFactor = targetSum / total;
                arr = arr.map(x => Math.round(x * scaleFactor));
            
                return arr;
            }

            function getSliderValue() {
                const slider = document.getElementById('jspsych-audio-slider-response-response');
                // check if the slider exists to avoid null reference errors
                if (slider) {
                  // return the current value of the slider as a number
                  return Number(slider.value);
                } else {
                  // if the slider is not found, return null or throw an error
                  console.error('Slider not found');
                  return null;
                }
              }
              
            // save responses and stop all audio
            display_element.querySelector("#jspsych-pairwise-audio-submit").addEventListener("click", (e) => {
                e.preventDefault();
                // measure response time
                const endTime = performance.now();
                const rt_trial = Math.round(endTime - startTime);
                const rt_tile = Math.round(endTime - startTimeTile);
                const rt_slider = (trial.include_slider) ? Math.round(endTime - startTimeSlider) : -999;

                // retrieve the selected likert response
                // const likertResponse = getSelectedLikertResponse();
                sliderResponse = (trial.include_slider) ? getSliderValue() : -999;

                // save data
                trial_data = {
                    rt_trial: rt_trial,
                    rt_tile: rt_tile,
                    rt_slider: rt_slider,
                    response_tile: +tileResponse,
                    response_slider: sliderResponse,
                    replay_probe1: replay_probe[0],
                    replay_probe2: replay_probe[1],
                    probes: { probe1: extractStimulus(trial.probe1), probe2: extractStimulus(trial.probe2) },
                    stimuli: extractStimulus(trial.stimulus)
                };

                if (trial.include_score) {
                    trial_data.points = points;
                    trial_data.streak = streak;
                }

                slider.removeEventListener('input', sliderUpdater);

                // make sure all audio is stopped playing
                disableAudio();
                // remove event listeners for selecting tiles
                document.querySelectorAll('.jspsych-audio-tile').forEach(tile => {
                    tile.removeEventListener('click', selectTileResponse);
                });

                if (trial.include_slider) {
                    provideFeedback(trial_data, this);
                } else {
                    document.querySelector('#jspsych-pairwise-audio-next').click();
                }
            });

            function provideFeedback(trial_data, _this) {
                endCurrentSequence = false;
                // remove likert scale and submit button
                display_element.querySelector("#jspsych-pairwise-audio-submit").style.display = "none";
                // display_element.querySelector('#jspsych-likert-container').style.display = 'none';
                display_element.querySelector('#jspsych-audio-slider-response-wrapper').style.display = 'none';
                // hide the tile percentage elements
                // display_element.querySelectorAll('.tile-percent').forEach((tile) => {
                //     tile.style.display = "none";
                // })

                const otherTile = trial_data.response_tile === 1 ? 2 : (trial_data.response_tile === 2 ? 1 : trial_data.response_tile);
                document.querySelector(`#tile-percent${trial_data.response_tile}`).innerHTML = `${randomPercent}%`;
                document.querySelector(`#tile-percent${trial_data.response_tile}`).style.opacity = 0.6;
                document.querySelector(`#tile-percent${otherTile}`).innerHTML = `${100 - randomPercent}%`;
                document.querySelector(`#tile-percent${otherTile}`).style.opacity = 0.6;
                
                // activate 'next' button
                display_element.querySelector("#jspsych-pairwise-audio-next").style.display = "inline-block";

                // add the percentage feedback next to the tiles
                let feedbackColour;
                if (randomPercent < 50) {
                    feedbackColour = "red";
                } else {
                    feedbackColour = "green";
                }

                // IF participant responds too slow, encourage them to speed up
                let rt_warning;
                if (tile_rt > 3000) {
                    rt_warning = "<br><br>Too slow! Try to respond faster next time";
                } else {
                    rt_warning = "";
                }

                const feedbackText = `<b class="bigger" style="color: ${feedbackColour};">${randomPercent}%</b> of players chose the same tone
                    <br><br>
                    You responded in <b>${+(tile_rt / 1000).toFixed(2)} seconds</b>
                    `
                    + rt_warning;
                display_element.querySelector('#jspsych-triplet-audio-sort-preamble').innerHTML = `<p>${feedbackText}</p>`;

                display_element.querySelector('#feedbackAnnotation').innerHTML = `Your guess is shown by the red line, against what other people guessed.`;
                

                // create fake data for the likert scale feedback
                const fakeDataMean = ((trial_data.response_slider / 10) +5) + (Math.random() * 2) * (Math.random() < 0.5 ? -1 : 1);
                const fakeData = generateNormalDistArray(fakeDataMean);

                console.log(fakeData);

                renderChart(fakeData, trial_data.response_slider); 
            }

            display_element.querySelector("#jspsych-pairwise-audio-next").addEventListener("click", (e) => {
                e.preventDefault();
                disableAudio();
                display_element.innerHTML = "";
                this.jsPsych.finishTrial(trial_data);
            });

            let startTime = performance.now();
            let startTimeTile = performance.now();
            let startTimeSlider = performance.now();

        }
    }
    PairwiseAudio2Plugin.info = info;

    return PairwiseAudio2Plugin;

})(jsPsychModule);