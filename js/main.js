'use strict'

const MINE = '💥'
const EMPTY = ' '

const gLevel = {
    SIZE: 4,
    MINES: 2
}
const gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gBoard = null
var gLives = 2
var gIsFirstClick = true
var gTimerInterval = null

function onInit() {
    // console.log('Initializing game')
    adjustLivesForLevel()
    refreshLivesDisplay()
    gBoard = buildBoard()
    renderBoard(gBoard)
    gIsFirstClick = true

    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0


    clearInterval(gTimerInterval)
    gTimerInterval = null
    document.getElementById('timer').innerText = ''

    document.getElementById('mine-count').innerText = gLevel.MINES
    document.getElementById('lives-count').innerText = gLives

    document.getElementById('game-message').innerText = ''

    const elBoard = document.querySelector('.board')
    elBoard.addEventListener('contextmenu', (event) => event.preventDefault())
}

function resetGame() {
    // console.log('Game reset')

    clearInterval(gTimerInterval)
    gTimerInterval = null
    gGame.secsPassed = 0
    document.getElementById('timer').innerText = gGame.secsPassed

    refreshLivesDisplay()
    document.getElementById('game-message').innerText = ''

    updateSmiley('😃')

    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0

    onInit()
}

function updateSmiley(smiley) {
    const elSmileyButton = document.getElementById('smiley-button')
    elSmileyButton.innerText = smiley
}

function setLevel(size, mines) {
    gLevel.SIZE = size
    gLevel.MINES = mines

    gLives = size === 4 ? 2 : 3

    // console.log(`Level set: ${size}x${size}, Mines: ${mines}, Lives: ${gLives}`)
    resetGame()

    document.getElementById('mine-count').innerText = gLevel.MINES
    document.getElementById('lives-count').innerText = gLives

}

function adjustLivesForLevel() {
    gLives = gLevel.SIZE === 4 ? 2 : 3
    // console.log(`Lives set to ${gLives} for level ${gLevel.SIZE}x${gLevel.SIZE}`)
}

function buildBoard() {
    // console.log('Building board')
    const board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }

    // console.log(board)
    // console.table(board)
    return board
}

function renderBoard(board) {
    // console.log('Rendering board')
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[i].length; j++) {

            const cell = board[i][j]
            const className = `cell cell-${i}-${j} ${cell.isShown ? 'revealed' : ''}`
            const cellContent = cell.isMarked
                ? '🚩'
                : cell.isShown
                    ? (cell.isMine ? MINE : cell.minesAroundCount || EMPTY)
                    : EMPTY
            strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this, ${i}, ${j})">${cellContent}</td>`

        }
        strHTML += '</tr>'
    }
    const elContainer = document.querySelector('.board')
    elContainer.innerHTML = strHTML
}

function setMinesNegsCount(board) {
    // console.log('Setting neighboring mine counts')
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j].minesAroundCount = countMinesAround(board, i, j)
        }
    }
}

function countMinesAround(board, rowIdx, colIdx) {
    var count = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[0].length) continue
            if (board[i][j].isMine) count++
        }
    }
    return count
}

function onCellClicked(elCell, i, j) {
    // console.log(`Cell clicked: (${i}, ${j})`)

    const cell = gBoard[i][j]

    if (cell.isShown || cell.isMarked) return

    if (gIsFirstClick) {
        gIsFirstClick = false

        document.getElementById('game-info').style.display = 'block'

        gGame.secsPassed = 1
        document.getElementById('timer').innerText = gGame.secsPassed
        gTimerInterval = setInterval(() => {
            gGame.secsPassed++
            document.getElementById('timer').innerText = gGame.secsPassed
        }, 1000)

        // console.log('placing mines after first click')
        placeMinesAfterFirstClick(i, j)
        setMinesNegsCount(gBoard)
        renderBoard(gBoard)
    }

    cell.isShown = true
    gGame.shownCount++

    if (cell.isMine) {
        gLives--
        refreshLivesDisplay()
        // console.log(`Mine clicked! Lives remaining: ${gLives}`)

        if (gLives === 0) {
            gGame.isOn = false
            // console.log('Game Over, No lives left.')
            revealAllMines()
            updateSmiley('🤯')
            clearInterval(gTimerInterval)
            return
        }
    } else {
        elCell.innerText = cell.minesAroundCount || EMPTY
        elCell.classList.add('revealed')
        // console.log(`Revealed safe cell: ${cell.minesAroundCount}`)

        if (cell.minesAroundCount === 0) {
            expandShown(gBoard, elCell, i, j)
        }
        checkGameOver()
    }
    renderBoard(gBoard)
}

function placeMinesAfterFirstClick(excludeRow, excludeCol) {
    var minesPlaced = 0

    while (minesPlaced < gLevel.MINES) {
        const i = getRandomInt(0, gLevel.SIZE)
        const j = getRandomInt(0, gLevel.SIZE)

        if ((i === excludeRow && j === excludeCol) || gBoard[i][j].isMine) continue

        gBoard[i][j].isMine = true
        minesPlaced++
    }
}

function refreshLivesDisplay() {
    const elLivesCount = document.getElementById('lives-count')
    elLivesCount.innerText = gLives
}

function revealAllMines() {
    // console.log('Revealing all mines')
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (cell.isMine) {
                const elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.innerText = MINE
                elCell.classList.add('revealed')
            }
        }
    }
    const elMessage = document.getElementById('game-message')
    elMessage.innerText = 'Game Over! No lives left.'
    updateSmiley('🤯')
}

function checkGameOver() {
    let revealedSafeCells = 0
    let markedMines = 0
    const totalSafeCells = (gLevel.SIZE * gLevel.SIZE) - gLevel.MINES;

    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (!cell.isMine && cell.isShown) {
                revealedSafeCells++
            }
            if (cell.isMine && cell.isMarked) {
                markedMines++
            }
        }
    }

    if (revealedSafeCells === totalSafeCells && markedMines === gLevel.MINES) {
        
        gGame.isOn = false
        clearInterval(gTimerInterval)
        
        const elMessage = document.getElementById('game-message')
        elMessage.innerText = 'YOU WIN! 🏆'
        elMessage.style.display = 'block'
        
        updateSmiley('😎')
    }
}


function onCellMarked(elCell, i, j) {
    const cell = gBoard[i][j]
    if (cell.isShown) return
    cell.isMarked = !cell.isMarked
    gGame.markedCount += cell.isMarked ? 1 : -1
    elCell.innerText = cell.isMarked ? '🚩' : EMPTY
    checkGameOver()
}


function expandShown(board, elCell, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === rowIdx && j === colIdx) continue

            const neighbor = board[i][j]
            const elNeighborCell = document.querySelector(`.cell-${i}-${j}`)

            if (!neighbor.isShown && !neighbor.isMarked) {
                neighbor.isShown = true

                elNeighborCell.innerText = neighbor.minesAroundCount || EMPTY
                elNeighborCell.classList.add('revealed')

                if (neighbor.minesAroundCount === 0) {
                    expandShown(board, elNeighborCell, i, j)
                }
            }
        }
    }
}



function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min)
    const maxFloored = Math.floor(max)
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}