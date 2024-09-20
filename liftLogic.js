
let currLiftPositionArr = []
let noOfFloors
let noOfLifts
let liftCallsQueue = []
let intervalId
let allLiftInfo
let activeLiftsDestinations = []
let floorCapacity = []


document.getElementById('submit').addEventListener('click',(e)=>{
    e.preventDefault()
    startVirtualSimulation ()
})

const liftsInput = document.getElementById('noOfLifts');

document.getElementById('noOfFloors').addEventListener('input', (e) => {
    const floors = parseInt(e.target.value);

    // Set lifts input to 1 and make it unchangeable if floors input is 1
    if (floors === 1) {
        liftsInput.value = 1;
        liftsInput.disabled = true; // Disable the lifts input
    } else {
        liftsInput.disabled = false; // Enable the lifts input
    }
});


function startVirtualSimulation () {
    clearInterval(intervalId)
    if (validateLiftAndFloorEntries()) {
        generateFloors(noOfFloors)
        generateLifts(noOfLifts)
        addButtonFunctionalities()
        intervalId = setInterval(fullfillLiftCallsQueue,1000)
    }
}

const validateLiftAndFloorEntries = () => {
    noOfFloors = parseInt(document.getElementById('noOfFloors').value)
    noOfLifts = parseInt(document.getElementById('noOfLifts').value)

    if (!noOfFloors || !noOfLifts) {
        alert('Please enter both the number of floors and lifts')
        return false
    }

    return true
}


const generateFloors = (n)=> {
    document.getElementById('simulationArea').innerHTML = ''
    for (let i=0;i<n;i++) {
        let currfloor = `L${n-i-1}`
        let floorNo = `floor-${n - i - 1}`
        let currFloor = document.createElement('div')
        currFloor.setAttribute('id',floorNo)

        currFloor.classList.add('floor')
        
        let buttonHtml = ''
        if (i === 0) { // Top floor
            buttonHtml = `<button id=down${currfloor} class="button-floor downBttn" style="background: rgb(0, 255, 64); border-radius: 2px;">Down</button>`
        } else if (i === n - 1) { // Ground floor
            buttonHtml = `<button id=up${currfloor} class="button-floor upBttn" style="background: yellow; border-radius: 2px;">Up</button>`
        } else { // Middle floors
            buttonHtml = `
            <button id=up${currfloor} class="button-floor upBttn" style="background: rgb(0, 255, 64); border-radius: 2px;">Down</button>
            <button id=down${currfloor} class="button-floor downBttn" style="background: yellow; border-radius: 2px;">Up</button>
            `
        }
        
        currFloor.innerHTML = `
        <div>
        ${buttonHtml}
        </div>
        `;

        document.getElementById('simulationArea').appendChild(currFloor);
    }
}

function addButtonFunctionalities() {
    const allButtons = document.querySelectorAll('.button-floor');
    allButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetFlr = parseInt(btn.id.slice(-1));
            
            // Disable the button to prevent further calls until the lift is free
            btn.disabled = true;
            
            // Call the lift for the floor
            if (!activeLiftsDestinations.includes(targetFlr)) {
                liftCallsQueue.push({ targetFlr, button: btn });
                fullfillLiftCallsQueue(); // Process the lift queue immediately
            }
        });
    });
}

function translateLift(liftNo, targetLiftPosn) {
    const reqLift = document.getElementById(`Lift-${liftNo}`);
    const currLiftPosn = parseInt(currLiftPositionArr[liftNo]);

    if (currLiftPosn !== targetLiftPosn) {
        allLiftInfo[liftNo].inMotion = true;
        let unitsToMove = parseInt(Math.abs(targetLiftPosn - currLiftPosn) + 1);
        let motionDis = -100 * parseInt(targetLiftPosn);
        reqLift.style.transitionTimingFunction = 'linear';
        reqLift.style.transform = `translateY(${motionDis}px)`;
        reqLift.style.transitionDuration = `${unitsToMove * 2}s`;

        let timeInMs = unitsToMove * 2000;
        setTimeout(() => {
            currLiftPositionArr[liftNo] = targetLiftPosn;
            animateLiftsDoors(liftNo, targetLiftPosn);
        }, timeInMs);
    } else {
        allLiftInfo[liftNo].inMotion = true;
        animateLiftsDoors(liftNo, targetLiftPosn);
    }
}

function animateLiftsDoors(liftNo, targetLiftPosn) {
    const leftGate = document.getElementById(`L${liftNo}left_gate`);
    const rightGate = document.getElementById(`L${liftNo}right_gate`);
    leftGate.classList.toggle('animateLiftsDoorsOnFloorStop');
    rightGate.classList.toggle('animateLiftsDoorsOnFloorStop');

    setTimeout(() => {
        allLiftInfo[liftNo].inMotion = false;
        leftGate.classList.toggle('animateLiftsDoorsOnFloorStop');
        rightGate.classList.toggle('animateLiftsDoorsOnFloorStop');
        activeLiftsDestinations = activeLiftsDestinations.filter(item => item !== targetLiftPosn);
    }, 5000);
}


function findNearestFreeLift(flrNo) {
    let prevDiff = Number.MAX_SAFE_INTEGER;
    let nearestAvailableLift = -1;

    for (let i = 0; i < currLiftPositionArr.length; i++) {
        if (!allLiftInfo[i].inMotion) {
            const currDiff = Math.abs(currLiftPositionArr[i] - flrNo);
            if (currDiff < prevDiff) {
                prevDiff = currDiff;
                nearestAvailableLift = i;
            }
        }
    }

    return nearestAvailableLift;
}

const generateLifts = (n)=> {
    allLiftInfo = []
    for (let i=0;i<n;i++) {
        let liftNo = `Lift-${i}`
        const currLift = document.createElement('div');
        currLift.setAttribute('id',liftNo)
        currLift.classList.add('lifts');
        currLift.innerHTML = `
            <p>Lift${i+1}</p>
            <div class="gate gateLeft" id="L${i}left_gate"></div>
            <div class="gate gateRight" id="L${i}right_gate"></div>
        `;
        currLift.style.left = `${(i+1)*90}px`;
        currLift.style.top = '0px'
        document.getElementById('floor-0').appendChild(currLift);
        currLiftPositionArr[i] = 0
        
        const currliftDetail = {}
        currliftDetail.id = liftNo
        currliftDetail.inMotion = false
        allLiftInfo.push(currliftDetail)
    }
}

function fullfillLiftCallsQueue() {
    if (!(liftCallsQueue.length)) return;

    const { targetFlr, button } = liftCallsQueue[0];

    const liftToMove = findNearestFreeLift(targetFlr);
    if (liftToMove !== -1) {
        // Call the nearest available lift
        translateLift(liftToMove, targetFlr);

        // Remove the current lift call from the queue
        liftCallsQueue.shift();

        // Re-enable the button after the lift completes the task
        setTimeout(() => {
            button.disabled = false;
        }, calculateLiftTravelTime(liftToMove, targetFlr));
    }
}

function calculateLiftTravelTime(liftNo, targetLiftPosn) {
    const currLiftPosn = parseInt(currLiftPositionArr[liftNo]);
    const unitsToMove = parseInt(Math.abs(targetLiftPosn - currLiftPosn) + 1);
    return unitsToMove * 2000 + 5000; // Time for lift movement + door operation (in ms)
}
