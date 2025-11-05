class BattleshipGame {
    constructor() {
        // ИЗМЕНЕНИЕ РАЗМЕРОВ ИГРОВОГО ПОЛЯ
        this.boardSize = 10; // Размер поля: 8, 10 или 12
        
        // ИЗМЕНЕНИЕ ЦВЕТА КОРАБЛЕЙ ИГРОКА
        this.playerColor = '#2196F3';
        
        // ИЗМЕНЕНИЕ ЦВЕТА КОРАБЛЕЙ ПРОТИВНИКА  
        this.enemyColor = '#FF5722';
        
        this.ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
        
        this.init();
    }

    init() {
        this.playerBoard = this.createBoard('playerBoard', true);
        this.enemyBoard = this.createBoard('enemyBoard', false);
        this.playerShips = this.placeShips();
        this.enemyShips = this.placeShips();
        this.gameActive = true;
        this.playerTurn = true;
        
        this.updateDisplay();
        this.setupEventListeners();
    }

    createBoard(boardId, showShips) {
        const board = [];
        const container = document.getElementById(boardId);
        container.style.gridTemplateColumns = `repeat(${this.boardSize}, 30px)`;
        
        for(let y = 0; y < this.boardSize; y++) {
            board[y] = [];
            for(let x = 0; x < this.boardSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                if(boardId === 'enemyBoard') {
                    cell.addEventListener('click', () => this.playerAttack(x, y));
                }
                
                container.appendChild(cell);
                board[y][x] = {
                    element: cell,
                    ship: false,
                    hit: false,
                    miss: false
                };
            }
        }
        
        return board;
    }

    placeShips() {
        const ships = [];
        const board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(false));
        
        this.ships.forEach(shipSize => {
            let placed = false;
            while(!placed) {
                const horizontal = Math.random() > 0.5;
                const x = Math.floor(Math.random() * (this.boardSize - (horizontal ? shipSize : 0)));
                const y = Math.floor(Math.random() * (this.boardSize - (horizontal ? 0 : shipSize)));
                
                if(this.canPlaceShip(board, x, y, shipSize, horizontal)) {
                    const ship = {x, y, size: shipSize, horizontal, hits: 0};
                    ships.push(ship);
                    
                    for(let i = 0; i < shipSize; i++) {
                        const shipX = horizontal ? x + i : x;
                        const shipY = horizontal ? y : y + i;
                        board[shipY][shipX] = true;
                    }
                    placed = true;
                }
            }
        });
        
        return ships;
    }

    canPlaceShip(board, x, y, size, horizontal) {
        for(let i = -1; i <= size; i++) {
            for(let j = -1; j <= 1; j++) {
                let checkX, checkY;
                if(horizontal) {
                    checkX = x + i;
                    checkY = y + j;
                } else {
                    checkX = x + j;
                    checkY = y + i;
                }
                
                if(checkX >= 0 && checkX < this.boardSize && checkY >= 0 && checkY < this.boardSize) {
                    if(board[checkY][checkX]) return false;
                }
            }
        }
        return true;
    }

    playerAttack(x, y) {
        if(!this.gameActive || !this.playerTurn) return;
        
        const cell = this.enemyBoard[y][x];
        if(cell.hit || cell.miss) return;
        
        const hitShip = this.checkHit(this.enemyShips, x, y);
        
        if(hitShip) {
            cell.hit = true;
            cell.element.classList.add('hit');
            hitShip.hits++;
            
            if(hitShip.hits === hitShip.size) {
                this.markSunkenShip(hitShip, this.enemyBoard);
            }
            
            this.showMessage('Попадание!');
        } else {
            cell.miss = true;
            cell.element.classList.add('miss');
            this.playerTurn = false;
            this.showMessage('Промах! Ход противника');
            setTimeout(() => this.enemyAttack(), 1000);
        }
        
        this.updateDisplay();
        this.checkGameOver();
    }

    enemyAttack() {
        if(!this.gameActive) return;
        
        let x, y, cell;
        do {
            x = Math.floor(Math.random() * this.boardSize);
            y = Math.floor(Math.random() * this.boardSize);
            cell = this.playerBoard[y][x];
        } while(cell.hit || cell.miss);
        
        const hitShip = this.checkHit(this.playerShips, x, y);
        
        if(hitShip) {
            cell.hit = true;
            cell.element.classList.add('hit');
            hitShip.hits++;
            
            if(hitShip.hits === hitShip.size) {
                this.markSunkenShip(hitShip, this.playerBoard);
            }
            
            setTimeout(() => this.enemyAttack(), 500);
        } else {
            cell.miss = true;
            cell.element.classList.add('miss');
            this.playerTurn = true;
            this.showMessage('Противник промахнулся! Ваш ход');
        }
        
        this.updateDisplay();
        this.checkGameOver();
    }

    checkHit(ships, x, y) {
        return ships.find(ship => {
            if(ship.horizontal) {
                return y === ship.y && x >= ship.x && x < ship.x + ship.size;
            } else {
                return x === ship.x && y >= ship.y && y < ship.y + ship.size;
            }
        });
    }

    markSunkenShip(ship, board) {
        for(let i = 0; i < ship.size; i++) {
            const x = ship.horizontal ? ship.x + i : ship.x;
            const y = ship.horizontal ? ship.y : ship.y + i;
            const cell = board[y][x];
            // ИЗМЕНЕНИЕ ЦВЕТА УНИЧТОЖЕННОГО КОРАБЛЯ
            cell.element.style.background = '#8B0000';
            // ИЗМЕНЕНИЕ ВАРИАНТА ОТОБРАЖЕНИЯ УНИЧТОЖЕННОГО КОРАБЛЯ
            cell.element.style.border = '2px solid #000';
        }
    }

    checkGameOver() {
        const playerAlive = this.playerShips.some(ship => ship.hits < ship.size);
        const enemyAlive = this.enemyShips.some(ship => ship.hits < ship.size);
        
        if(!playerAlive) {
            this.gameActive = false;
            this.showMessage('Вы проиграли!', true);
        } else if(!enemyAlive) {
            this.gameActive = false;
            this.showMessage('Вы победили!', true);
        }
    }

    updateDisplay() {
        this.updateBoard(this.playerBoard, this.playerShips, this.playerColor);
        this.updateBoard(this.enemyBoard, this.enemyShips, this.enemyColor);
        
        const playerAlive = this.playerShips.filter(ship => ship.hits < ship.size).length;
        const enemyAlive = this.enemyShips.filter(ship => ship.hits < ship.size).length;
        
        document.getElementById('playerShips').textContent = playerAlive;
        document.getElementById('enemyShips').textContent = enemyAlive;
        
        document.documentElement.style.setProperty('--player-color', this.playerColor);
        document.documentElement.style.setProperty('--enemy-color', this.enemyColor);
    }

    updateBoard(board, ships, color) {
        for(let y = 0; y < this.boardSize; y++) {
            for(let x = 0; x < this.boardSize; x++) {
                const cell = board[y][x];
                
                const isSunkenShip = ships.some(ship => {
                    if(ship.hits === ship.size) {
                        if(ship.horizontal) {
                            return y === ship.y && x >= ship.x && x < ship.x + ship.size;
                        } else {
                            return x === ship.x && y >= ship.y && y < ship.y + ship.size;
                        }
                    }
                    return false;
                });
                
                if(isSunkenShip) {
                    // ИЗМЕНЕНИЕ ЦВЕТА УНИЧТОЖЕННОГО КОРАБЛЯ
                    cell.element.style.background = '#8B0000';
                    // ИЗМЕНЕНИЕ ВАРИАНТА ОТОБРАЖЕНИЯ УНИЧТОЖЕННОГО КОРАБЛЯ
                    cell.element.style.border = '2px solid #000';
                    continue;
                }
                
                const hasShip = ships.some(ship => {
                    if(ship.horizontal) {
                        return y === ship.y && x >= ship.x && x < ship.x + ship.size;
                    } else {
                        return x === ship.x && y >= ship.y && y < ship.y + ship.size;
                    }
                });
                
                cell.ship = hasShip;
                
                if(hasShip && board === this.playerBoard) {
                    cell.element.style.setProperty('--ship-color', color);
                    cell.element.classList.add('ship');
                }
                
                if(cell.hit) {
                    cell.element.classList.add('hit');
                } else if(cell.miss) {
                    cell.element.classList.add('miss');
                }
            }
        }
    }

    showMessage(text, permanent = false) {
        const message = document.getElementById('gameMessage');
        message.textContent = text;
        message.style.display = 'block';
        
        if(!permanent) {
            setTimeout(() => {
                message.style.display = 'none';
            }, 1500);
        }
    }

    restartGame() {
        document.getElementById('playerBoard').innerHTML = '';
        document.getElementById('enemyBoard').innerHTML = '';
        this.init();
    }

    setupEventListeners() {
        document.getElementById('restartGame').addEventListener('click', () => this.restartGame());
    }
}

const game = new BattleshipGame();