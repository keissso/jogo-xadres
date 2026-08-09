// Matriz de estado do tabuleiro
const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let boardState = JSON.parse(JSON.stringify(initialBoard));
let selectedSquare = null;
let possibleMoves = [];
let currentPlayer = 'white';

const pieceSymbols = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

function getPieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'white' : 'black';
}

// 1. MOVIMENTOS FÍSICOS (BRUTOS)
function getRawPieceMoves(row, col, board = boardState) {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];
  const color = getPieceColor(piece);
  const type = piece.toLowerCase();

  function addMoveIfValid(r, c) {
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const targetPiece = board[r][c];
      if (!targetPiece || getPieceColor(targetPiece) !== color) {
        moves.push({ row: r, col: c });
        return !targetPiece;
      }
    }
    return false;
  }

  // Peão
  if (type === 'p') {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    if (!board[row + direction]?.[col]) {
      moves.push({ row: row + direction, col });
      if (row === startRow && !board[row + (2 * direction)]?.[col]) {
        moves.push({ row: row + (2 * direction), col });
      }
    }
    [-1, 1].forEach(offset => {
      const targetR = row + direction;
      const targetC = col + offset;
      if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
        const targetPiece = board[targetR][targetC];
        if (targetPiece && getPieceColor(targetPiece) !== color) {
          moves.push({ row: targetR, col: targetC });
        }
      }
    });
  }

  // Cavalo
  if (type === 'n') {
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2],  [1, 2],  [2, -1],  [2, 1]
    ];
    knightMoves.forEach(([rO, cO]) => addMoveIfValid(row + rO, col + cO));
  }

  // Bispo / Dama (Diagonais)
  if (type === 'b' || type === 'q') {
    const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    diagonals.forEach(([rO, cO]) => {
      let r = row + rO, c = col + cO;
      while (addMoveIfValid(r, c)) { r += rO; c += cO; }
    });
  }

  // Torre / Dama (Linhas Retas)
  if (type === 'r' || type === 'q') {
    const straights = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    straights.forEach(([rO, cO]) => {
      let r = row + rO, c = col + cO;
      while (addMoveIfValid(r, c)) { r += rO; c += cO; }
    });
  }

  // Rei
  if (type === 'k') {
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    kingMoves.forEach(([rO, cO]) => addMoveIfValid(row + rO, col + cO));
  }

  return moves;
}

// 2. ENCONTRAR O REI
function findKing(color, board = boardState) {
  const kingSymbol = color === 'white' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingSymbol) return { row: r, col: c };
    }
  }
  return null;
}

// 3. DETECTAR XEQUE
function isKingInCheck(color, board = boardState) {
  const kingPos = findKing(color, board);
  if (!kingPos) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && getPieceColor(piece) === opponentColor) {
        const opponentMoves = getRawPieceMoves(r, c, board);
        if (opponentMoves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// 4. MOVIMENTOS LEGAIS (IMPEDE SUICÍDIO DE REI)
function getLegalMoves(row, col) {
  const rawMoves = getRawPieceMoves(row, col, boardState);
  const color = getPieceColor(boardState[row][col]);

  return rawMoves.filter(move => {
    const tempBoard = JSON.parse(JSON.stringify(boardState));
    tempBoard[move.row][move.col] = tempBoard[row][col];
    tempBoard[row][col] = null;
    return !isKingInCheck(color, tempBoard);
  });
}

// 5. RENDERIZAÇÃO DO TABULEIRO
function renderBoard() {
  const boardElement = document.getElementById('board');
  if (!boardElement) return;

  boardElement.innerHTML = '';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');

      const isLight = (row + col) % 2 === 0;
      square.classList.add(isLight ? 'light' : 'dark');

      square.dataset.row = row;
      square.dataset.col = col;

      if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
        square.classList.add('selected');
      }

      const isPossibleMove = possibleMoves.some(m => m.row === row && m.col === col);
      if (isPossibleMove) {
        square.classList.add('possible-move');
      }

      const pieceCode = boardState[row][col];

      // Alerta de Xeque
      if (pieceCode && pieceCode.toLowerCase() === 'k') {
        const kingColor = getPieceColor(pieceCode);
        if (isKingInCheck(kingColor)) {
          square.classList.add('in-check');
        }
      }

      if (pieceCode) {
        square.textContent = pieceSymbols[pieceCode];
      }

      square.addEventListener('click', handleSquareClick);
      boardElement.appendChild(square);
    }
  }
}

// 6. GERENCIADOR DE CLIQUES
function handleSquareClick(event) {
  const square = event.currentTarget;
  const row = parseInt(square.dataset.row, 10);
  const col = parseInt(square.dataset.col, 10);
  const clickedPiece = boardState[row][col];

  if (selectedSquare) {
    if (selectedSquare.row === row && selectedSquare.col === col) {
      selectedSquare = null;
      possibleMoves = [];
      renderBoard();
      return;
    }

    if (clickedPiece && getPieceColor(clickedPiece) === currentPlayer) {
      selectedSquare = { row, col };
      possibleMoves = getLegalMoves(row, col);
      renderBoard();
      return;
    }

    const isValidMove = possibleMoves.some(m => m.row === row && m.col === col);
    if (isValidMove) {
      const pieceToMove = boardState[selectedSquare.row][selectedSquare.col];
      boardState[row][col] = pieceToMove;
      boardState[selectedSquare.row][selectedSquare.col] = null;

      selectedSquare = null;
      possibleMoves = [];
      currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
      renderBoard();
    }
    return;
  }

  if (clickedPiece && getPieceColor(clickedPiece) === currentPlayer) {
    selectedSquare = { row, col };
    possibleMoves = getLegalMoves(row, col);
    renderBoard();
  }
}

renderBoard();