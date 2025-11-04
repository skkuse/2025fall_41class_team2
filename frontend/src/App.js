// llm_project/frontend/src/App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // 4단계에서 만들 CSS 파일

// Django 서버 주소
const API_URL = 'http://127.0.0.1:8000/api';

function App() {
  // --- 상태 관리 (State) ---
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const [projects, setProjects] = useState([]); // 프로젝트 목록
  const [selectedProjectId, setSelectedProjectId] = useState(null); // 현재 선택된 프로젝트
  
  const [newProjectName, setNewProjectName] = useState(''); // 새 프로젝트 이름
  const [selectedFile, setSelectedFile] = useState(null); // 업로드할 파일
  
  const [query, setQuery] = useState(''); // 챗봇 질문
  const [chatHistory, setChatHistory] = useState([]); // 채팅 내역

  // --- API 클라이언트 (axios) ---
  // 토큰이 바뀔 때마다 axios의 기본 헤더를 설정
  const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Token ${token}` : ''
    }
  });

  // --- useEffect (토큰이 있으면 프로젝트 목록 불러오기) ---
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token); // 토큰을 로컬 스토리지에 저장
      fetchProjects();
    } else {
      localStorage.removeItem('token');
      setProjects([]); // 로그아웃 시 프로젝트 비우기
    }
  }, [token]); // 'token' 값이 바뀔 때마다 실행

  // --- 1. 인증 기능 ---
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/register/', { username, password, email });
      alert('회원가입 성공! 로그인해주세요.');
    } catch (error) {
      console.error('회원가입 실패:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/login/', { username, password });
      setToken(response.data.token); // [!] 토큰 설정
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  // --- 2. 프로젝트 기능 ---
  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects/');
      setProjects(response.data);
    } catch (error) {
      console.error('프로젝트 로딩 실패:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/projects/', { name: newProjectName });
      setNewProjectName('');
      fetchProjects(); // 목록 새로고침
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
    }
  };

  // --- 3. 문서 (파일) 기능 ---
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedProjectId) {
      alert('프로젝트를 선택하고 파일을 골라주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('project_id', selectedProjectId);
    formData.append('file', selectedFile);

    try {
      // [!] 파일 업로드는 Content-Type이 다름
      await apiClient.post('/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('파일 업로드 및 인덱싱 시작!');
      fetchProjects(); // 목록 새로고침 (새 파일 표시)
      setSelectedFile(null);
      e.target.reset(); // 파일 입력란 초기화
    } catch (error) {
      console.error('파일 업로드 실패:', error);
    }
  };

  const handleFileDelete = async (documentId) => {
    if (window.confirm('정말 이 파일을 삭제하시겠습니까? (벡터 DB에서도 삭제됩니다)')) {
      try {
        await apiClient.delete(`/documents/${documentId}/`);
        alert('파일 삭제 성공');
        fetchProjects(); // 목록 새로고침
      } catch (error) {
        console.error('파일 삭제 실패:', error);
      }
    }
  };

  // --- 4. 챗봇 기능 ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!query || !selectedProjectId) return;

    const userMessage = { sender: 'user', text: query };
    setChatHistory([...chatHistory, userMessage]); // 내 질문 먼저 표시
    setQuery('');

    try {
      const response = await apiClient.post(
        `/projects/${selectedProjectId}/chat/`,
        { query }
      );
      const botMessage = { sender: 'bot', text: response.data.answer };
      setChatHistory([...chatHistory, userMessage, botMessage]); // 봇 답변 표시
    } catch (error) {
      console.error('채팅 실패:', error);
      const errorMessage = { sender: 'bot', text: '답변 생성 중 오류 발생' };
      setChatHistory([...chatHistory, userMessage, errorMessage]);
    }
  };

  // 현재 선택된 프로젝트 찾기
  const currentProject = projects.find(p => p.id === selectedProjectId);

  // --- 5. 렌더링 (UI) ---
  if (!token) {
    // --- 로그인/회원가입 폼 ---
    return (
      <div className="container">
        <div className="auth-form">
          <h2>로그인</h2>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="사용자 이름" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">로그인</button>
          </form>
        </div>
        <div className="auth-form">
          <h2>회원가입</h2>
          <form onSubmit={handleRegister}>
            <input type="text" placeholder="사용자 이름" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">회원가입</button>
          </form>
        </div>
      </div>
    );
  }

  // --- 메인 애플리케이션 ---
  return (
    <div className="container">
      <button onClick={handleLogout} className="logout-button">로그아웃</button>
      
      {/* 1. 프로젝트 목록 및 생성 */}
      <div className="column">
        <h2>📚 내 프로젝트</h2>
        <form onSubmit={handleCreateProject}>
          <input 
            type="text" 
            placeholder="새 프로젝트 이름" 
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
          />
          <button type="submit">프로젝트 생성</button>
        </form>
        <ul className="project-list">
          {projects.map(project => (
            <li 
              key={project.id}
              className={project.id === selectedProjectId ? 'selected' : ''}
              onClick={() => {
                setSelectedProjectId(project.id);
                setChatHistory([]); // 프로젝트 바꾸면 채팅창 초기화
              }}
            >
              {project.name}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. 문서 관리 및 채팅 (프로젝트가 선택된 경우) */}
      {currentProject ? (
        <>
          <div className="column">
            <h2>📄 문서 관리 ({currentProject.name})</h2>
            <form onSubmit={handleFileUpload} className="file-upload-form">
              <input type="file" onChange={handleFileChange} accept=".pdf" required />
              <button type="submit">파일 업로드</button>
            </form>
            <ul className="document-list">
              {currentProject.documents.map(doc => (
                <li key={doc.id}>
                  <span>{doc.original_filename}</span>
                  <button onClick={() => handleFileDelete(doc.id)} className="delete-button">X</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="column">
            <h2>💬 챗봇 ({currentProject.name})</h2>
            <div className="chat-window">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="chat-form">
              <input 
                type="text" 
                placeholder="질문을 입력하세요..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit">전송</button>
            </form>
          </div>
        </>
      ) : (
        <div className="column-placeholder">
          <p>프로젝트를 선택하세요.</p>
        </div>
      )}
    </div>
  );
}

export default App;