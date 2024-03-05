const jsPsychPairwiseImage2 = (function (jspsych) {
    'use strict';

    const info = {
        name: "pairwise-image2",
        parameters: {
            stimulus: {
                type: jspsych.ParameterType.IMAGE,
                pretty_name: "Stimulus",
                default: undefined,
            },
            prompt: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Prompt1",
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
        },
    };
    /**
     * **pairwise-image**
     *
     *
     * @author Courtney Hilton
     */
    class PairwiseImage2Plugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {
            let html = "";
            let trial_data = {};
            let tile_rt, tileResponse;
            const randomPercent = Math.floor(Math.random() * (95 - 35)) + 35; // random filler value while testing


            // ------------- //
            // 1. CSS styles //
            // ------------- //


            // inject CSS for trial
            html += '<style id="jspsych-pairwise-audio-css">';
            // other layout CSS
            html += '#jspsych-comparison-image-container { display: flex; justify-content: center; align-items: center; }' +
                    '.jspsych-tile { border: 1px solid black; width: 10vh; height: 10vh; display: flex; justify-content: center; align-items: center; text-align: center; }' +
                    '.jspsych-tile-container { display: flex; margin: 0 10px; transition: all 0.3s ease; user-select: none; flex-direction: column; position: relative; }' +
                    '.selectedTile { box-shadow: 0 0 10px 7px red; opacity: 1 !important; }';
            // set the colours of the tiles
            html += `#tile1 { background-color: ${trial.tile_colours[0]}; }` +
                    `#tile2 { background-color: ${trial.tile_colours[1]}; }`;
            // setup likert scale
            html +=
                "#feedbackTile { display: none; }" + 
                "#jspsych-viz-container { display: none; }" + 
                "#jspsych-pairwise-audio-next { display: none; }";

            // score container
            html += `
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

            .tile-label {
                font-size: 2em;
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
            
            `;
            // close CSS
            html += "</style>";


            // ------------- //
            // 2. build HTML //
            // ------------- //

            // add a container for all the tiles plus the annotations
            html += '<div id="jspsych-triplet-audio-bigContainer">';


            html += `<div id="jspsych-pairwise-image-stimulus">
                <img src='${trial.stimulus}' style="width: 30vw;">
            </div><br><br>`;


            // show preamble text
            if (trial.prompt !== null) {
                html +=
                    '<div id="jspsych-triplet-audio-sort-preamble" class="jspsych-triplet-audio-sort-preamble">' +
                    trial.prompt +
                    '</div>' +
                    '<br>';
            }

            // add a container for all the tiles
            html += '<div id="jspsych-comparison-image-container">';

            // tile 1
            html += `
                <div class="jspsych-tile-container child-container">
                    <div class="jspsych-tile" id="tile1"><p class="tile-label">F</p></div>
                </div>
            `;

            // tile 2
            html += `
                <div class="jspsych-tile-container child-container">
                    <div class="jspsych-tile" id="tile2"><p class="tile-label">J</p></div>
                </div>
            `;

            html += '</div>'; // closing the container for all the tiles

            // adding chart
            html += '<div id="jspsych-viz-container">' + 
                '<canvas id="vizCanvas" width="40vw" height="30vh"></canvas>' + 
                '</div>';
            
            html += '</div>'; // closing the big main container

            html += '<br>';

            // add countdown timer
            html += `<div id="feedback-container">
                        <canvas id="countdown-timer" width="100" height="100"></canvas>
                        <span id="countdown-number">3</span>
                    </div>`;

            // add submit button
            html += `<button type="button" id="jspsych-pairwise-image-submit" class="jspsych-btn">${trial.button_label}</button>`;

            // add next button
            html += `<button type="button" id="jspsych-pairwise-audio-next" class="jspsych-btn">Next</button>`;

            display_element.innerHTML = html;

            // disable submit button (until all trials have been played at least once)
            document.querySelector("#jspsych-pairwise-image-submit").style.display = 'none';

            // make sure all opacities are normal
            document.querySelectorAll('.jspsych-tile').forEach(tile => {
                tile.style.opacity = '1';
            });


            // ------------- //
            // 3. animations //
            // ------------- //

            // ------ PHASE 1: tile response ------ // 
            function selectTileResponse(tileNum) {
                // save RT for selecting tile
                tile_rt = Math.round(performance.now() - startTimeTile);

                // remove 'selectedTile' class from all tiles (kinda redudant, but just making sure)
                document.querySelectorAll('.jspsych-tile').forEach(otherTile => {
                    otherTile.classList.remove('selectedTile');
                });

                // apply to selected tile
                document.querySelector(`#tile${tileNum}`).classList.toggle('selectedTile');

                tileResponse = tileNum;

                setTimeout(() => {
                    document.querySelector('#jspsych-pairwise-image-submit').click();
                }, 1000); 
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

            // ------------------------------ //
            // 4. stimulus playback functions //
            // ------------------------------ //


            // tracks the number of times the participant replays each probe
            let replay_probe = [0, 0];


            // -------------------------------- //
            // 7. submit button and data saving //
            // -------------------------------- //


            display_element.querySelector("#jspsych-pairwise-image-submit").addEventListener("click", (e) => {
                e.preventDefault();
                document.removeEventListener('keydown', tile1Listener);
                document.removeEventListener('keydown', tile2Listener);
                // measure response time
                const endTime = performance.now();
                const rt_trial = Math.round(endTime - startTime);
                const rt_tile = Math.round(endTime - startTimeTile);

                // save data
                trial_data = {
                    rt_trial: rt_trial,
                    rt_tile: rt_tile,
                    response_tile: +tileResponse,
                    replay_probe1: replay_probe[0],
                    replay_probe2: replay_probe[1]
                };
                // remove event listeners for selecting tiles
                document.querySelectorAll('.jspsych-tile').forEach(tile => {
                    tile.removeEventListener('click', selectTileResponse);
                });
                // next trial
                display_element.innerHTML = "";
                this.jsPsych.finishTrial(trial_data);
                
                
            });

            let startTime = performance.now();
            let startTimeTile = performance.now();

        }
    }
    PairwiseImage2Plugin.info = info;

    return PairwiseImage2Plugin;

})(jsPsychModule);