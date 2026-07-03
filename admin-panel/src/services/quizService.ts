import api from './api';

export interface Question {
  id?: number;
  text: string;
  image_url?: string;
  choices: string[];
  correct_choice: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  room_id: number;
  questions: Question[];
}

export interface QuizCreate {
  title: string;
  description: string;
  room_id: number | null;
  is_featured?: boolean;
  questions: Question[];
}

export const getQuizzes = async () => (await api.get<Quiz[]>('/quiz/')).data;
export const getQuiz = async (id: number) => (await api.get<Quiz>(`/quiz/${id}`)).data;
export const createQuiz = async (data: QuizCreate) => (await api.post<Quiz>('/quiz/', data)).data;
export const updateQuiz = async (id: number, data: QuizCreate) => (await api.put<Quiz>(`/quiz/${id}`, data)).data;
export const deleteQuiz = async (id: number) => (await api.delete(`/quiz/${id}`)).data;
