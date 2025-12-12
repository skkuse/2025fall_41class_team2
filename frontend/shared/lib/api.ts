const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const syncUserToBackend = async (user: any) => {
    try {
        const response = await fetch(`${API_BASE_URL}/user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                id: user.id,
                email: user.email,
                username: user.user_metadata?.full_name || user.email?.split('@')[0],
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to sync user to backend');
        }

        return await response.json();
    } catch (error) {
        console.error('Error syncing user:', error);
        throw error;
    }
};

// Projects
export const getProjects = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
};

export const createProject = async (title: string, description?: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ title, description }),
        });

        if (!response.ok) {
            throw new Error('Failed to create project');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

export const getProject = async (projectId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch project');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching project:', error);
        throw error;
    }
};

export const updateProject = async (projectId: string, title?: string, description?: string) => {
    try {
        const body: any = {};
        if (title !== undefined) body.title = title;
        if (description !== undefined) body.description = description;

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('Failed to update project');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

export const deleteProject = async (projectId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to delete project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};

// Documents
export const getDocuments = async (projectId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
    }
};

export const uploadDocument = async (projectId: string, file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload document');
        }

        return await response.json();
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
};

export const deleteDocument = async (projectId: string, documentId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents/${documentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};

export const getDocumentPages = async (projectId: string, documentId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents/${documentId}/pages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document pages');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching document pages:', error);
        throw error;
    }
};

// Messages
export const getMessages = async (projectId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

export const sendMessage = async (projectId: string, content: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        return await response.json();
    } catch (error) {
    }
};

// Quizzes
export const generateQuiz = async (projectId: string, numQuestions: number = 5, quizType: 'MULTIPLE_CHOICE' | 'FLASHCARD' = 'MULTIPLE_CHOICE') => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ num_questions: numQuestions, quiz_type: quizType }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate quiz');
        }

        return response.json();
    } catch (error) {
        throw error
    }
};

export const getSuggestedQuestions = async (projectId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/suggested-questions`, {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Failed to fetch suggested questions');
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching suggestions:", error)
        return []
    }
}

export const getQuizzes = async (projectId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/quizzes`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch quizzes');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        throw error;
    }
};

export const getQuiz = async (projectId: string, quizId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/quizzes/${quizId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch quiz');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching quiz:', error);
        throw error;
    }
};
