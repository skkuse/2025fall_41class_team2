from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import os
import json
from .chroma_service import ChromaService

class QuizService:
    def __init__(self):
        self.chroma_service = ChromaService()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.0
        )

    def generate_quiz(self, project_id: str, num_questions=5, quiz_type='MULTIPLE_CHOICE'):
        try:
            from api.models import Project, Quiz, Question
            
            project = Project.objects.get(id=project_id)
            
            vector_store = self.chroma_service.get_vector_store(project_id)
            retriever = vector_store.as_retriever(search_kwargs={"k": 15})
            docs = retriever.invoke("important key concepts and definitions summary")
            context = "\n\n".join([doc.page_content for doc in docs])
            
            if not context:
                return None

            questions_data = self._generate_questions_json(context, num_questions, quiz_type)
            
            quiz = Quiz.objects.create(
                project=project,
                title=f"Generated {'Flashcards' if quiz_type == 'FLASHCARD' else 'Quiz'} ({len(questions_data)} Questions)",
                quiz_type=quiz_type
            )
            
            for q in questions_data:
                Question.objects.create(
                    quiz=quiz,
                    question_text=q['question_text'],
                    options=q['options'],
                    answer=q['answer']
                )
            return quiz

        except Exception:
            return None

    def _generate_questions_json(self, context, num, q_type):
        if q_type == 'FLASHCARD':
            template = """
            Generate {num} flashcards (term/definition) in Korean JSON from Context.
            Format: [{{"question_text": "Term", "options": [], "answer": "Definition"}}]
            Context: {context}
            """
        else:
            template = """
            Generate {num} multiple-choice questions in Korean JSON from Context.
            Format: [{{"question_text": "", "options": ["A","B","C","D"], "answer": "Correct Option"}}]
            Context: {context}
            """
            
        prompt = ChatPromptTemplate.from_template(template)
        chain = prompt | self.llm | StrOutputParser()
        res = chain.invoke({"context": context, "num": num})
        return json.loads(res.replace("```json", "").replace("```", "").strip())
