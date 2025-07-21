import React, { useState, useRef, useEffect } from 'react';
import './LadderGame.css';

const LadderGame = () => {
  const [players, setPlayers] = useState(['', '']);
  const [results, setResults] = useState(['', '']);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [path, setPath] = useState(null);
  const canvasRef = useRef(null);
  const [ladderData, setLadderData] = useState(null);
  const [playerColors, setPlayerColors] = useState([]);
  
  // 서로 구분되는 색상 팔레트 생성
  const generateDistinctColors = (count) => {
    const colors = [];
    const baseHue = Math.floor(Math.random() * 360);
    
    for (let i = 0; i < count; i++) {
      // 색상환을 균등하게 나누어 색상 선택
      const hue = (baseHue + (360 / count) * i) % 360;
      const saturation = 70 + (i % 2) * 20; // 70% 또는 90%
      const lightness = 50 + (i % 3) * 10; // 50%, 60%, 70% 순환
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    
    // 배열을 섞어서 예측 가능한 패턴 방지
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
    
    return colors;
  };

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, '']);
      setResults([...results, '']);
    }
  };

  const removePlayer = () => {
    if (players.length > 2) {
      setPlayers(players.slice(0, -1));
      setResults(results.slice(0, -1));
    }
  };

  const updatePlayer = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const updateResult = (index, value) => {
    const newResults = [...results];
    newResults[index] = value;
    setResults(newResults);
  };

  const generateLadder = () => {
    const numberOfPlayers = players.length;
    const rows = 10;
    const connections = [];
    
    for (let row = 0; row < rows; row++) {
      const rowConnections = [];
      const usedColumns = new Set();
      
      // 마지막 행에는 가로선을 그리지 않음
      if (row < rows - 1) {
        for (let col = 0; col < numberOfPlayers - 1; col++) {
          // 현재 열이나 다음 열이 이미 사용되었는지 확인
          if (!usedColumns.has(col) && !usedColumns.has(col + 1) && Math.random() > 0.5) {
            rowConnections.push({ from: col, to: col + 1 });
            // 사용된 열 표시
            usedColumns.add(col);
            usedColumns.add(col + 1);
          }
        }
      }
      connections.push(rowConnections);
    }
    
    return { rows, connections, numberOfPlayers };
  };

  const drawLadder = (ladder) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const verticalSpacing = width / (ladder.numberOfPlayers + 1);
    const horizontalSpacing = height / (ladder.rows + 1);
    
    // 가로선을 먼저 그리기
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ladder.connections.forEach((rowConnections, rowIndex) => {
      const y = 30 + horizontalSpacing * (rowIndex + 1);
      rowConnections.forEach(connection => {
        const x1 = verticalSpacing * (connection.from + 1);
        const x2 = verticalSpacing * (connection.to + 1);
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      });
    });
    
    // 세로선을 나중에 그려서 가로선과의 교차점이 자연스럽게 연결되도록 함
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < ladder.numberOfPlayers; i++) {
      const x = verticalSpacing * (i + 1);
      
      // 각 세로선을 가로선 사이의 구간별로 그리기
      let startY = 30;
      
      for (let row = 0; row <= ladder.rows; row++) {
        const endY = row === ladder.rows ? height - 30 : 30 + horizontalSpacing * (row + 1);
        
        // 현재 구간에 가로선이 있는지 확인
        const hasConnectionOnLeft = row < ladder.rows && ladder.connections[row].some(conn => conn.to === i);
        const hasConnectionOnRight = row < ladder.rows && ladder.connections[row].some(conn => conn.from === i);
        const hasConnectionAbove = row > 0 && ladder.connections[row - 1].some(conn => conn.from === i || conn.to === i);
        
        // 가로선이 없는 구간만 세로선 그리기
        if (!hasConnectionOnLeft && !hasConnectionOnRight && !hasConnectionAbove) {
          ctx.beginPath();
          ctx.moveTo(x, startY);
          ctx.lineTo(x, endY);
          ctx.stroke();
        } else {
          // 가로선이 있는 경우 작은 간격을 두고 세로선 그리기
          const gap = 3; // 가로선과의 간격
          
          if (hasConnectionAbove) {
            ctx.beginPath();
            ctx.moveTo(x, startY + gap);
            ctx.lineTo(x, endY - (hasConnectionOnLeft || hasConnectionOnRight ? gap : 0));
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY - gap);
            ctx.stroke();
          }
        }
        
        startY = endY;
      }
    }
  };

  const tracePath = (playerIndex) => {
    if (!ladderData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const verticalSpacing = width / (ladderData.numberOfPlayers + 1);
    const horizontalSpacing = height / (ladderData.rows + 1);
    
    let currentPosition = playerIndex;
    const pathPoints = [];
    
    let x = verticalSpacing * (currentPosition + 1);
    let y = 30;
    pathPoints.push({ x, y });
    
    for (let row = 0; row < ladderData.rows; row++) {
      y = 30 + horizontalSpacing * (row + 1);
      
      const connection = ladderData.connections[row].find(
        conn => conn.from === currentPosition || conn.to === currentPosition
      );
      
      if (connection) {
        // 세로선에서 가로선으로 이동하는 지점
        pathPoints.push({ x, y });
        currentPosition = connection.from === currentPosition ? connection.to : connection.from;
        x = verticalSpacing * (currentPosition + 1);
        // 가로선에서 다음 세로선으로 이동하는 지점
        pathPoints.push({ x, y });
      } else {
        // 가로선이 없는 경우 세로선을 따라 계속 진행
        pathPoints.push({ x, y });
      }
    }
    
    // 마지막 지점까지 정확히 연결
    y = height - 30;
    pathPoints.push({ x, y });
    
    // 선택된 플레이어의 색상 사용
    ctx.strokeStyle = playerColors[playerIndex] || '#ff0000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    pathPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    
    return currentPosition;
  };

  const startGame = () => {
    if (players.every(p => p.trim()) && results.every(r => r.trim())) {
      const ladder = generateLadder();
      setLadderData(ladder);
      setIsGameStarted(true);
      setSelectedPlayer(null);
      setPath(null);
      
      // 각 플레이어에게 구분되는 색상 할당
      const colors = generateDistinctColors(players.length);
      setPlayerColors(colors);
    } else {
      alert('모든 참가자와 결과를 입력해주세요!');
    }
  };

  const selectPlayer = (index) => {
    if (!isGameStarted) return;
    
    setSelectedPlayer(index);
    const resultIndex = tracePath(index);
    setPath({ from: index, to: resultIndex });
  };

  const resetGame = () => {
    setIsGameStarted(false);
    setSelectedPlayer(null);
    setPath(null);
    setLadderData(null);
    setPlayerColors([]);
  };

  useEffect(() => {
    if (isGameStarted && ladderData) {
      drawLadder(ladderData);
    }
  }, [isGameStarted, ladderData]);

  return (
    <div className="ladder-game">
      {!isGameStarted ? (
        <div className="setup">
          <div className="player-setup">
            <h3>참가자 설정</h3>
            <div className="player-inputs">
              {players.map((player, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`참가자 ${index + 1}`}
                  value={player}
                  onChange={(e) => updatePlayer(index, e.target.value)}
                />
              ))}
            </div>
            <div className="player-controls">
              <button onClick={addPlayer} disabled={players.length >= 6}>
                참가자 추가
              </button>
              <button onClick={removePlayer} disabled={players.length <= 2}>
                참가자 제거
              </button>
            </div>
          </div>
          
          <div className="result-setup">
            <h3>결과 설정</h3>
            <div className="result-inputs">
              {results.map((result, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`결과 ${index + 1}`}
                  value={result}
                  onChange={(e) => updateResult(index, e.target.value)}
                />
              ))}
            </div>
          </div>
          
          <button className="start-button" onClick={startGame}>
            게임 시작
          </button>
        </div>
      ) : (
        <div className="game">
          <div className="game-board">
            <div className="players-row">
              {players.map((player, index) => {
                const xPosition = 600 / (players.length + 1) * (index + 1);
                return (
                  <button
                    key={index}
                    className={`player-button ${selectedPlayer === index ? 'selected' : ''}`}
                    onClick={() => selectPlayer(index)}
                    style={{
                      left: `${xPosition}px`,
                      transform: 'translateX(-50%)',
                      backgroundColor: playerColors[index],
                      borderColor: playerColors[index]
                    }}
                  >
                    {player}
                  </button>
                );
              })}
            </div>
            
            <div className="canvas-container">
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={350}
                className="ladder-canvas"
              />
            </div>
            
            <div className="results-row">
              {results.map((result, index) => {
                const xPosition = 600 / (players.length + 1) * (index + 1);
                return (
                  <div
                    key={index}
                    className={`result ${path && path.to === index ? 'selected' : ''}`}
                    style={{
                      left: `${xPosition}px`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {result}
                  </div>
                );
              })}
            </div>
          </div>
          
          {path && (
            <div className="result-message">
              {players[path.from]}님의 결과는 "{results[path.to]}" 입니다!
            </div>
          )}
          
          <button className="reset-button" onClick={resetGame}>
            다시 시작
          </button>
        </div>
      )}
    </div>
  );
};

export default LadderGame;