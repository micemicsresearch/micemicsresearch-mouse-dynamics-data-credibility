// define socket connectino to server
const socket = new WebSocket('ws://localhost:8083')

// click targets fixed positions
const positionsX = [[850, 910, 30, 400, 740, 505, 310, 240], [325, 240, 130, 925, 610, 750, 210, 410], [720, 115, 40, 405, 820, 930, 415, 150]]
const positionsY = [[250, 430, 335, 15, 520, 210, 420, 215], [120, 540, 40, 110, 400, 245, 235, 405], [245, 540, 205, 450, 40, 515, 35, 100]]
// click targets pseudo random positions
const pseudoRandomPositionsX = [[2, 10, 9, 8, 1, 3, 7, 4], [10, 8, 1, 1, 7, 3, 6, 6], [9, 10, 1, 4, 5, 8, 6, 2]] //3rd - 1st desing - [2, 5, 6, 10, 1, 3, 3, 1] 
const pseudoRandomPositionsY = [[2, 3, 5, 1, 4, 6, 4, 3], [3, 5, 1, 5, 2, 2, 6, 4], [6, 1, 2, 1, 6, 4, 2, 5]] //3rd - 1st desing - [5, 6, 1, 4, 3, 1, 6, 4]
// click targets warmup positions
const warmUpPositionsX = [100, 880, 156, 680, 420, 790, 240, 500]
const warmUpPositionsY = [100, 500, 324, 400, 300, 50, 465, 150]


// random schuffle fixed and pseudo random positions order
const pointsPositions = [{ position: 'R1', value: 0 }, { position: 'R2', value: 0 }, { position: 'R3', value: 0 },
                        { position: 'F1', value: 0 }, { position: 'F2', value: 0 }, { position: 'F3', value: 0 }]
for (let position of pointsPositions) {
    position.value = Math.random()
}
const schuffledPointsPositions = pointsPositions.sort((a, b) => a.value - b.value).map(el => el.position)

// define count settings
const allRepetitions = 6
const pointsPerRepetition = 8

// define rendering settings
const canvasWidth = 1000
const canvasHeight = 600
const targetSize = 50

// define pseudo random points settings
const boxesX = 10
const boxesY = 6
const boxSizeX = (canvasWidth - targetSize) / boxesX
const boxSizeY = (canvasHeight - targetSize) / boxesY
const maxBoxX = boxSizeX - targetSize
const maxBoxY = boxSizeY - targetSize
const minDistanceFromCorner = 5
const boxRandom = [[minDistanceFromCorner, minDistanceFromCorner], [minDistanceFromCorner, maxBoxX], 
                [Math.floor(maxBoxX/2), Math.floor(maxBoxY/2)], [maxBoxY, minDistanceFromCorner], 
                [maxBoxY, maxBoxX]]     // left upper corner, right upper corner, middle, left lower corner, right lower corner


// mouse tracking variables
let loggingMouse = false
let targetMouseDown = false
let targetMouseUp = false
let loggingBaseTimestamp = null

// mouse move metrics counting variables
/*let moveCounter = 0
let previousPositionX = null
let previousPositionY = null
let overallDistance = 0*/


oCanvas.domReady(function () {
    // define canvas settings and create canvas
    const canvasElement = document.getElementById("canvas")
    canvasElement.width = canvasWidth
    canvasElement.height = canvasHeight
    var canvas = oCanvas.create({
        canvas: "#canvas",
        background: "#ccc"
    })

    // define modals and html elements
    const taskSpecification = document.getElementById('taskSpecification')
    const taskFinishedModal = new bootstrap.Modal('#taskFinishedModal', { keyboard: false, backdrop: 'static' })
    const startModal = new bootstrap.Modal('#startModal', { keyboard: false, backdrop: 'static' })
    const nextButton = document.getElementById('nextButton')
    const startButton = document.getElementById('startButton')
    const sessionId = parseInt(window.sessionStorage.getItem('sessionId'))

    // open instructions modal at the begining of experiment points task
    const instructionsModal = new bootstrap.Modal('#instructionsModal', { keyboard: false, backdrop: 'static', focus: true })
    instructionsModal.show()

    // get info if warm up task has to be included from sessionStorage and update experiment points page
    const warmUpTask = window.sessionStorage.getItem("warmUpTask")
    if (warmUpTask === "true") {
        const warmUpInfo = document.getElementById("instructions_warpUpInfo")
        warmUpInfo.innerHTML = "Pozn. <b>1. úloha</b> je len <b>zahrievacia</b> na vyskúšanie si a zoznámenie sa s úlohami."
        // update task specification heading
        taskSpecification.innerHTML = "Zahrievacia úloha"
    }

    instructionsModal._element.addEventListener('hide.bs.modal', event => {
        if (warmUpTask === "true") {
            generatePoints(warmUpPositionsX, warmUpPositionsY, false, "warmup")
            taskId = "warmup"
            loggingMouse = true
            loggingBaseTimestamp = Date.now()
        } else {
            startModal.show()
        }
    })

    // define event listeners for modals hiding
    nextButton.addEventListener('click', () => {
        generateRepetition()
        loggingMouse = true
        loggingBaseTimestamp = Date.now()
        taskFinishedModal.hide()
    })

    startButton.addEventListener('click', () => {
        generateRepetition()
        loggingMouse = true
        loggingBaseTimestamp = Date.now()
        startModal.hide()
    })

    // global variables for repetition and target counting
    let actualRepetition = 0
    let actualTargetOrder = 1
    let taskId = null

    // define canvas elements for displaying target points
    const boxPrototype = canvas.display.rectangle({ 
        width: targetSize, 
        height: targetSize, 
        fill: "#f00",
        stroke: "inside 2px #000"
    })

    const textPrototype = canvas.display.text({
        x: Math.floor(targetSize / 2),
        y: Math.floor(targetSize / 2),
        origin: { x: "center", y: "center" },
        align: "center",
        font: "bold 25px/1.5 sans-serif",
        fill: "#000"
    })

    // function for creating target point with event listeners included
    function createTarget(options) {
        let targetBox = boxPrototype.clone({
            x: options.x,
            y: options.y,
            order: options.order
        })

        let targetBoxText = textPrototype.clone({
            text: options.order
        })

        targetBox.bind("mousedown", function () {
            if (targetBox.order === actualTargetOrder) {
                targetMouseDown = true
            }
        })

        targetBox.bind("mouseup", function () {
            if (targetBox.order === actualTargetOrder) {
                targetMouseUp = true
            }
        })

        targetBox.bind("click", function () {
            if (targetBox.order === actualTargetOrder) {
                targetBox.fill = "#6f0"
                canvas.redraw()
                if (targetBox.order === pointsPerRepetition) {
                    taskFinishedModal.show()

                    // move counter code
                    /*console.log('MoveCounter: ', moveCounter)
                    console.log('overall distance: ', overallDistance)
                    console.log('average distance: ', overallDistance / moveCounter)

                    // reset counters
                    moveCounter = 0
                    overallDistance = 0*/
                }
                actualTargetOrder += 1
            } else {
                // bad click animation
                let positionX = this.x
                for (let i = 0; i < 6; i++) {
                    this.animate({
                        x: i % 2 == 0 ? this.x + 5 : this.x - 5
                    }, {
                        duration: 40,
                        easing: "ease-in-out-cubic"
                    })
                }
                // return to previous position after bad click animation
                this.animate({
                    x: positionX
                }, {
                    duration: 40,
                    easing: "ease-in-out-cubic"
                })
            }
        })

        targetBox.addChild(targetBoxText)
        options.parent.addChild(targetBox)
    }

    // function for generating points on given positions as argument
    function generatePoints (pointsX, pointsY, random, taskId) {
        for (var i = 0; i < pointsX.length; i++) {

            let positionX = null
            let positionY = null

            // define position of target point left corner
            if (random === false) {
                positionX = pointsX[i]
                positionY = pointsY[i]
            } else if (random === true) {
                const randomNumber = Math.floor(Math.random() * (boxRandom.length))
                const randomPositionX = boxRandom[randomNumber][0]
                const randomPositionY = boxRandom[randomNumber][1]

                positionX = Math.floor((pointsX[i] - 1) * boxSizeX + randomPositionX)
                positionY = Math.floor((pointsY[i] - 1) * boxSizeY + randomPositionY)
                const centerPositionX = positionX + Math.floor(targetSize / 2)
                const centerPositionY = positionY + Math.floor(targetSize / 2)
                sendPointPos(sessionId, centerPositionX, centerPositionY, i + 1, taskId)
            }
            
            createTarget({
                x: positionX,
                y: positionY,
                order: i + 1,
                parent: canvas
            })
        }
    }

    // function generates new repetition and redirects after last repetition
    function generateRepetition () {
        canvas.reset()
        actualRepetition += 1

        if (actualRepetition > allRepetitions) {
            const prototypeNumber = window.sessionStorage.getItem("prototypeNumber")
            if (prototypeNumber === "1") {
                window.location.href = '/experiment_prototype.html'
                return
            } else if (prototypeNumber === "2") {
                window.location.href = '/experiment_prototype2.html'
                return
            }
        }

        // update task specification heading
        taskSpecification.innerHTML = "Úloha " + actualRepetition + "/" + allRepetitions

        // reset actual order of point to click
        actualTargetOrder = 1

        taskId = schuffledPointsPositions[actualRepetition - 1]
        console.log('taskId: ', taskId)
        let index = parseInt(taskId[1]) - 1

        // generate new points
        if (taskId[0] == 'R') {
            generatePoints(pseudoRandomPositionsX[index], pseudoRandomPositionsY[index], true, taskId)
        } else if (taskId[0] == 'F') {
            generatePoints(positionsX[index], positionsY[index], false, taskId)
        }
    }

    // add mousemove event listener for mouse tracking
    canvasElement.addEventListener('mousemove', (event) => {
        if (loggingMouse) {
            const actualTimestamp = Date.now() - loggingBaseTimestamp
            sendMousePos(sessionId, canvas.mouse.x, canvas.mouse.y, actualTimestamp, false, 'mousemove', actualTargetOrder, taskId)
            
            // move counter code
            /*moveCounter += 1

            if (previousPositionX) {
                overallDistance += Math.hypot(Math.abs(canvas.mouse.x - previousPositionX), Math.abs(canvas.mouse.y - previousPositionY))
            }
            previousPositionX = canvas.mouse.x
            previousPositionY = canvas.mouse.y*/
        }
    }, {passive: true})

    // add mousedown event listener for mouse tracking
    canvasElement.addEventListener('mousedown', (event) => {
        if (loggingMouse) {
            const actualTimestamp = Date.now() - loggingBaseTimestamp
            if (targetMouseDown) {
                //console.log('target mousedown')
                sendMousePos(sessionId, canvas.mouse.x, canvas.mouse.y, actualTimestamp, true, 'mousedown', actualTargetOrder, taskId)
                targetMouseDown = false

            } else {
                //console.log('mousedown')
                sendMousePos(sessionId, canvas.mouse.x, canvas.mouse.y, actualTimestamp, false, 'mousedown', actualTargetOrder, taskId)
            }
        }
    }, {passive: true})

    // add mouseup event listener for mouse tracking
    canvasElement.addEventListener('mouseup', (event) => {
        if (loggingMouse) {
            const actualTimestamp = Date.now() - loggingBaseTimestamp
            if (targetMouseUp) {
                //console.log('target mouseup')
                sendMousePos(sessionId, canvas.mouse.x, canvas.mouse.y, actualTimestamp, true, 'mouseup', actualTargetOrder, taskId)
                targetMouseUp = false

                // if all targets already clicked -> turn off mouse logging
                if (actualTargetOrder === pointsPerRepetition + 1) {
                    loggingMouse = false
                }
            } else {
                //console.log('mouseup')
                sendMousePos(sessionId, canvas.mouse.x, canvas.mouse.y, actualTimestamp, false, 'mouseup', actualTargetOrder, taskId)
            }
        }
    }, {passive: true})
})

// function sends given data about mouse position to server through socket
function sendMousePos(sessionId, x, y, timestamp, isTarget, event, nextTargetNumber, taskId) {
    data = {
        sessionId: sessionId,
        posX: x,
        posY: y,
        timestamp: timestamp,
        event: event,
        nextTargetNumber: nextTargetNumber,
        isTarget: isTarget,
        taskId: taskId,
    }
    sendObject = {
        type: 'mousePosition',
        data: data
    }
    //console.log('move: ', sendObject)
    socket.send(JSON.stringify(sendObject))
}

// function sends given data about target point position to server through socket
function sendPointPos(sessionId, x, y, targetNumber, taskId) {
    data = {
        sessionId: sessionId,
        posX: x,
        posY: y,
        targetNumber: targetNumber,
        taskId: taskId
    }
    sendObject = {
        type: 'pointPosition',
        data: data
    }
    //console.log('point: ', sendObject)
    socket.send(JSON.stringify(sendObject))
}