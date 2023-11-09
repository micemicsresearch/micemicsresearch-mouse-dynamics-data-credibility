//define socket connectino to server
const socket = new WebSocket('ws://localhost:8082')

const canvasWidth = 1000
const canvasHeight = 600
const targetRadius = 30
const gameDuration = 15

const targetRadiusSmall = Math.floor(targetRadius / 3)
const targetRadiusMedium = Math.floor(targetRadius / 3 * 2)

// scale factor for target scaling
const scaleFactor = 1.5

// constant to define time in ms
const reactionBaseTime = 500        // time after which points gain is penalized
const scaleAnimationDuration = 2000 // duration of target scaling animation

// points penalization constants
const maxPenalizedReactionTime = scaleAnimationDuration - reactionBaseTime // max reaction time, which is penalized
const maxPenalizationProportion = 0.7

// range for generating random target positions
const generatingRangeX = canvasWidth - 2 * targetRadius * scaleFactor
const generatingRangeY = canvasHeight - 2 * targetRadius * scaleFactor

// minimum delta of consecutive points
const minDeltaX = Math.floor(canvasWidth / 8)
const minDeltaY = Math.floor(canvasHeight / 8)

// points addition
const outerHitPoints = 1
const middleHitPoints = 5
const centerHitPoints = 10


oCanvas.domReady(async function () {
    // canvas settings
    const canvasElement = document.getElementById("canvas")
    canvasElement.width = canvasWidth
    canvasElement.height = canvasHeight
    
    var canvas = oCanvas.create({
        canvas: "#canvas",
        background: "#c7dffc"
    })
    
    // check if game started in experiment or own tab
    const fromGameTab = window.sessionStorage.getItem("fromGameTab") === "true" ? true : false 
    const targetGamesNumber = 3 // number of games in experiment
    const sessionId = parseInt(window.sessionStorage.getItem("sessionId"))

    // get html elements
    const timeElement = document.getElementById("time")
    const pointsElement = document.getElementById("points")
    const hitsElement = document.getElementById("hits")
    const gainGamePoints = document.getElementById("gainPointsIndicator")
    const gainGamePointsInExperiment = document.getElementById("gainPointsIndicatorInExperiment")
    const experimentInstruction = document.getElementById("experimentInstruction")
    const gameRepetitionInfo = document.getElementById("gameRepetitionInfo")
    const backToIntroButton = document.getElementById("backToIntroButton")
    const continueInExperimentButton = document.getElementById("continueInExperimentButton")

    // turn off back to intro button when game played in experiment
    if (!fromGameTab) {
        backToIntroButton.style.display = "none"
    }

    //modals
    const afterGameModal = new bootstrap.Modal('#afterGameModal', { keyboard: false, backdrop: 'static', focus: true })
    const afterGameModalInExperiment = new bootstrap.Modal('#afterGameModalInExperiment', { keyboard: false, backdrop: 'static', focus: true })
    const startInstructionsModal = new bootstrap.Modal('#startInstructionsModal', { keyboard: false, backdrop: 'static', focus: true })
    const topResultsModal = new bootstrap.Modal('#topResultsModal', { keyboard: false, backdrop: 'static', focus: true })

    // get top game results from database
    const topResultsList = document.getElementById("topResultsList")
    await writeTopResultsToHtml(topResultsList)
    
    startInstructionsModal._element.addEventListener('hidden.bs.modal', event => {
        topResultsModal.show()
    })

    topResultsModal._element.addEventListener('hidden.bs.modal', event => {
        newGame()
    })

    afterGameModal._element.addEventListener('hidden.bs.modal', event => {
        newGame()
    })

    //mouse tracking variables
    let loggingMouse = false
    let targetMouseDown = false
    let targetMouseUp = false
    let loggingBaseTimestamp = null
    //mouse move metrics counting
    /*let moveCounter = 0
    let previousPositionX = null
    let previousPositionY = null
    let overallDistance = 0*/

    afterGameModalInExperiment._element.addEventListener('hidden.bs.modal', event => {
        if (gameNumber == targetGamesNumber) {
            window.location.href = "/experiment_points.html"
        } else {
            newGame()
        }
    })

    // in game settings
    let secondsToEnd
    let numberOfHits = 0
    let numberOfPoints = 0
    let gameNumber = 0  // number of games counter - used for minigame in experiment

    function generateNumber(max) {
        return Math.floor(Math.random() * (max + 1))
    }

    function generateOther(previous, delta, base, addition) {
        let newNumber = generateNumber(base) + addition
        while(Math.abs(previous - newNumber) < delta) {
            newNumber = generateNumber(base) + addition
        }
        return newNumber
    }

    function countProportialAdditionPoints(pointsAddition, timeToClick) {
        if (timeToClick > reactionBaseTime) {
            if (timeToClick > scaleAnimationDuration) {
                timeToClick = scaleAnimationDuration
            }
            timeAfterReactionBaseTime = timeToClick - reactionBaseTime
            pointsAddition = pointsAddition - pointsAddition * (maxPenalizationProportion * (timeAfterReactionBaseTime / maxPenalizedReactionTime))
        }
        return pointsAddition
    }

    function createTarget(first, previousCoordinateX, previousCoordinateY) {
        //generate coordinates
        let newCoordinateX = generateOther(previousCoordinateX, minDeltaX, generatingRangeX, targetRadius * scaleFactor)
        let newCoordinateY = generateOther(previousCoordinateY, minDeltaY, generatingRangeY, targetRadius * scaleFactor)

        //create target
        let target1 = canvas.display.ellipse({ 
            x: newCoordinateX,
            y: newCoordinateY,
            radius_x: targetRadius,
            radius_y: targetRadius,
            fill: "#000",
            targetMiddle: false,
            targetCenter: false
        })

        targetCreationTimestamp = Date.now()

        function mouseDownHandler () {
            if (loggingMouse) {
                targetMouseDown = true
            }
        }

        function mouseUpHandler () {
            if (loggingMouse) {
                targetMouseUp = true
            }
        }

        target1.bind("mousedown", mouseDownHandler)
        target1.bind("mouseup", mouseUpHandler)

        target1.bind("click", function handler () {
            if (loggingMouse) {
                targetClicked = true
            }
            this.unbind("click", handler)
            this.unbind("mousedown", mouseDownHandler)
            this.unbind("mouseup", mouseUpHandler)
            target1.stop()
            timeToClick = Date.now() - targetCreationTimestamp
            if (first) {
                loggingMouse = true
                loggingBaseTimestamp = Date.now()
                startTimer()
            }

            // hits and points incrementation
            numberOfHits += 1
            if (target1.targetCenter) {
                pointsAddition = centerHitPoints
            } else if (target1.targetMiddle) {
                pointsAddition = middleHitPoints
            } else {
                pointsAddition = outerHitPoints
            }

            // console.log('points addition before penalization:', pointsAddition)
            // console.log('time to click: ', timeToClick)
            if (!first) {
                pointsAddition = Math.ceil(countProportialAdditionPoints(pointsAddition, timeToClick))
            }
            // console.log('points addition after penalization:', pointsAddition)
            // console.log('')

            numberOfPoints += pointsAddition

            hitsElement.innerHTML = numberOfHits
            pointsElement.innerHTML = numberOfPoints
            createTarget(false, newCoordinateX, newCoordinateY)
            this.fadeOut("short", "linear", function () {
                canvas.removeChild(target1, true)
            })
        })


        let target2 = canvas.display.ellipse({ 
            origin: { x: "center", y: "center" },
            radius_x: targetRadiusMedium,
            radius_y: targetRadiusMedium,
            fill: "#fff",
        })

        target2.bind("click", function handler () {
            this.unbind("click", handler)
            target1.targetMiddle = true
            // console.log('clicked target 2')
        })


        let target3 = canvas.display.ellipse({ 
            origin: { x: "center", y: "center" },
            radius_x: targetRadiusSmall,
            radius_y: targetRadiusSmall,
            fill: "#f00",
        })

        target3.bind("click", function handler () {
            this.unbind("click", handler)
            target1.targetCenter = true
            // console.log('clicked target 3')
        })


        target1.bind("scale", function scaleHandler () {
            this.animate({
                radius_x: this.radius_x * scaleFactor,
                radius_y: this.radius_y * scaleFactor
            }, {
                duration: scaleAnimationDuration,
                easing: "linear"
            })

            target2.animate({
                radius_x: target2.radius_x * scaleFactor,
                radius_y: target2.radius_y * scaleFactor
            }, {
                duration: scaleAnimationDuration,
                easing: "linear"
            })

            target3.animate({
                radius_x: target3.radius_x * scaleFactor,
                radius_y: target3.radius_y * scaleFactor
            }, {
                duration: scaleAnimationDuration,
                easing: "linear"
            })
        })

        target1.addChild(target2)
        target2.addChild(target3)
        canvas.addChild(target1)

        if (!first) { 
            target1.trigger("scale")
        }

        sendPointPos(sessionId, newCoordinateX, newCoordinateY, numberOfHits + 1, gameNumber)
        //console.log('target created, targetNumber:', numberOfHits + 1)
    }

    function newGame() {
        gameNumber += 1
        numberOfHits = 0
        numberOfPoints = 0
        secondsToEnd = gameDuration - 1

        hitsElement.innerHTML = numberOfHits
        pointsElement.innerHTML = numberOfPoints
        timeElement.innerHTML = "0:" + gameDuration

        createTarget(true, 0, 0)
    }
    
    function startTimer() {
        let interval = setInterval(async function() {
            let seconds = secondsToEnd > 9 ? secondsToEnd : "0" + secondsToEnd
            timeElement.innerHTML = "0:" + seconds

            if (secondsToEnd === 0) {
                loggingMouse = false
                /*let endTime = Date.now()
                console.log('MoveCounter: ', moveCounter)
                console.log('overall distance: ', overallDistance)
                console.log('average distance: ', overallDistance / moveCounter)
                console.log('overall time: ', endTime - loggingBaseTimestamp)
                console.log('average time: ', (endTime - loggingBaseTimestamp) / moveCounter)
                moveCounter = 0
                overallDistance = 0*/

                canvas.reset()
                clearInterval(interval)
                let sendResult = await sendGameResult(sessionId, numberOfPoints, numberOfHits, gameNumber)
                if (sendResult) {
                    if (fromGameTab) {
                        gainGamePoints.innerHTML = numberOfPoints
                        afterGameModal.show()
                    } else {
                        gainGamePointsInExperiment.innerHTML = numberOfPoints
                        if (gameNumber == targetGamesNumber) {
                            gameRepetitionInfo.style.display = "none"
                            continueInExperimentButton.innerHTML = "Pokračovať ďalej v experimente"
                        }
                        afterGameModalInExperiment.show()
                    }
                }
            }

            secondsToEnd -= 1
        }, 1000)
    }

    //hide experiment instruction if game is not played in experiment
    if (fromGameTab) {
        experimentInstruction.style.display = "none"
    }
    
    //start game with instructions modal shown
    startInstructionsModal.show()

    //add mouse tracking
    canvasElement.addEventListener('mousemove', (event) => {
        if (loggingMouse) {
            const actualTimestamp = Date.now() - loggingBaseTimestamp
            let targetNumber = numberOfHits + 1
            sendMousePos(canvas.mouse.x, canvas.mouse.y, actualTimestamp, false, 'mousemove', sessionId, targetNumber, gameNumber)
            //console.log('moving - X: ', canvas.mouse.x, ' Y: ',  canvas.mouse.y, ' t: ', actualTimestamp)
            
            /*moveCounter += 1

            if (previousPositionX) {
                overallDistance += Math.hypot(Math.abs(canvas.mouse.x - previousPositionX), Math.abs(canvas.mouse.y - previousPositionY))
            }
            previousPositionX = canvas.mouse.x
            previousPositionY = canvas.mouse.y*/

        }
    }, {passive: true})


    canvasElement.addEventListener('mousedown', (event) => {
        if (loggingMouse) {
            const actualTimestamp = Date.now() - loggingBaseTimestamp
            if (targetMouseDown) {
                //console.log('target mousedown')
                sendMousePos(canvas.mouse.x, canvas.mouse.y, actualTimestamp, true, 'mousedown', sessionId, numberOfHits + 1, gameNumber)
                targetMouseDown = false
                //console.log('target clicked, next point:', numberOfHits + 1)
            } else {
                //console.log('click mousedown')
                sendMousePos(canvas.mouse.x, canvas.mouse.y, actualTimestamp, false, 'mousedown', sessionId, numberOfHits + 1, gameNumber)
                //console.log('click, next point:', numberOfHits + 1)
            }
        }
    }, {passive: true})

    canvasElement.addEventListener('mouseup', (event) => {
        if (loggingMouse) {
            const actualTimestamp = Date.now() - loggingBaseTimestamp
            if (targetMouseUp) {
                //console.log('target mouseup')
                sendMousePos(canvas.mouse.x, canvas.mouse.y, actualTimestamp, true, 'mouseup', sessionId, numberOfHits + 1, gameNumber)
                targetMouseUp = false
                //console.log('target clicked, next point:', numberOfHits + 1)
            } else {
                //console.log('click mouseup')
                sendMousePos(canvas.mouse.x, canvas.mouse.y, actualTimestamp, false, 'mouseup', sessionId, numberOfHits + 1, gameNumber)
                //console.log('click, next point:', numberOfHits + 1)
            }
        }
    }, {passive: true})
})


//sending data through websocket functions
function sendMousePos(x, y, timestamp, isTarget, event, sessionId, nextTargetNumber, gameNumber) {
    data = {
        sessionId: sessionId,
        posX: x,
        posY: y,
        timestamp: timestamp,
        isTarget: isTarget,
        event: event,
        nextTargetNumber: nextTargetNumber,
        gameNumber: gameNumber
    }
    sendObject = {
        type: 'mousePosition',
        data: data
    }
    socket.send(JSON.stringify(sendObject))
}

function sendPointPos(sessionId, x, y, targetNumber, gameNumber) {
    data = {
        sessionId: sessionId,
        posX: x,
        posY: y,
        targetNumber: targetNumber,
        gameNumber: gameNumber
    }
    sendObject = {
        type: 'pointPosition',
        data: data
    }
    socket.send(JSON.stringify(sendObject))
}

async function sendGameResult(sessionId, numberOfPoints, numberOfHits, gameNumber) {
    return new Promise((resolve, reject) => {
        axios.post('/minigame_result', {
            sessionId: sessionId,
            points: numberOfPoints,
            hits: numberOfHits,
            gameNumber: gameNumber,
        }).then(response => {
            if (response.data.status === 'ok') {
                resolve(true)
            } else {
                alert("Niečo nie je v poriadku. Kontaktujte tvorcu experimentu.")
                resolve(false)
            }
        }).catch(error => {
            console.log("error: ", error)
            alert("Niečo nie je v poriadku. Kontaktujte tvorcu experimentu.")
            resolve(false)
        })
    })
}

async function writeTopResultsToHtml(element) {
    const result = await axios.get('/minigame_top_results')
    const gameResults = result.data.result
    //console.log("results: ", gameResults)
    let resultsHTML = ''
    for(const index in gameResults) {
        let order = parseInt(index) + 1
        let addString = '<li>' + order + '. ' + gameResults[index].points + '</li>'
        resultsHTML += addString
    }
    element.innerHTML = resultsHTML
}