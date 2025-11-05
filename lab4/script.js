class BattleshipGame {
    constructor() {
        this.boardWidth = 10;  // ИЗМЕНЕНИЕ РАЗМЕРОВ ИГРОВОГО ПОЛЯ
        this.boardHeight = 10; // ИЗМЕНЕНИЕ РАЗМЕРОВ ИГРОВОГО ПОЛЯ // Размер поля: 8, 10 или 12
        
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
        container.style.gridTemplateColumns = `repeat(${this.boardWidth}, 30px)`;
        container.style.gridTemplateRows = `repeat(${this.boardHeight}, 30px)`;
        container.style.width = `${this.boardWidth * 30 + 4}px`;
        container.style.height = `${this.boardHeight * 30 + 4}px`;
        
        for(let y = 0; y < this.boardHeight; y++) {
            board[y] = [];
            for(let x = 0; x < this.boardWidth; x++) {
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
        const board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(false));
        
        this.ships.forEach(shipSize => {
            let placed = false;
            while(!placed) {
                const horizontal = Math.random() > 0.5;
                const maxX = this.boardWidth - (horizontal ? shipSize : 0);
                const maxY = this.boardHeight - (horizontal ? 0 : shipSize);
                
                if(maxX <= 0 || maxY <= 0) {
                    console.error('Корабль слишком большой для поля');
                    break;
                }
                
                const x = Math.floor(Math.random() * maxX);
                const y = Math.floor(Math.random() * maxY);
                
                if(this.canPlaceShip(board, x, y, shipSize, horizontal)) {
                    const ship = {x, y, size: shipSize, horizontal, hits: 0};
                    ships.push(ship);
                    
                    for(let i = 0; i < shipSize; i++) {
                        const shipX = horizontal ? x + i : x;
                        const shipY = horizontal ? y : y + i;
                        if(shipY < this.boardHeight && shipX < this.boardWidth) {
                            board[shipY][shipX] = true;
                        }
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
                
                if(checkX >= 0 && checkX < this.boardWidth && checkY >= 0 && checkY < this.boardHeight) {
                    if(board[checkY][checkX]) return false;
                }
            }
        }
        return true;
    }

    playerAttack(x, y) {
        if(!this.gameActive || !this.playerTurn) return;
        if(x >= this.boardWidth || y >= this.boardHeight) return;
        
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
            x = Math.floor(Math.random() * this.boardWidth);
            y = Math.floor(Math.random() * this.boardHeight);
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
            if(y < this.boardHeight && x < this.boardWidth) {
                const cell = board[y][x];
                cell.element.style.background = '#8B0000'; // ИЗМЕНЕНИЕ ЦВЕТА УНИЧТОЖЕННОГО КОРАБЛЯ
                cell.element.style.border = '2px solid #000'; // ИЗМЕНЕНИЕ ВАРИАНТА ОТОБРАЖЕНИЯ УНИЧТОЖЕННОГО КОРАБЛЯ
            }
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
        this.updateBoard(this.playerBoard, this.playerShips, 'player');
        this.updateBoard(this.enemyBoard, this.enemyShips, 'enemy');
        
        const playerAlive = this.playerShips.filter(ship => ship.hits < ship.size).length;
        const enemyAlive = this.enemyShips.filter(ship => ship.hits < ship.size).length;
        
        document.getElementById('playerShips').textContent = playerAlive;
        document.getElementById('enemyShips').textContent = enemyAlive;
    }

    updateBoard(board, ships, type) {
        for(let y = 0; y < this.boardHeight; y++) {
            for(let x = 0; x < this.boardWidth; x++) {
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
                    cell.element.classList.add('ship', 'player');
                } else if(hasShip && board === this.enemyBoard) {
                    cell.element.classList.add('ship', 'enemy');
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