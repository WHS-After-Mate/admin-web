import tempfile
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def create_rag_chain(uploaded_file):
    # 1. 문서 로드 (PDF 텍스트 추출)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(uploaded_file.getvalue())
        tmp_path = tmp_file.name

    loader = PyMuPDFLoader(tmp_path)
    docs = loader.load()

    # 2. 분할 (400자 단위 청크 생성)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
    splits = text_splitter.split_documents(docs)

    # 3 & 4. 임베딩 및 벡터 DB(FAISS) 저장
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)

    # 5. 검색기 (Retriever) 생성
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    # 6. 프롬프트 생성
    prompt = ChatPromptTemplate.from_template("""
다음 문맥(Context)만을 사용하여 질문에 답변하세요. 
알 수 없는 내용이라면 "제시된 문서에서 내용을 찾을 수 없습니다."라고 답하세요.

문맥:
{context}

질문:
{question}

답변:
""")

    # 7. LLM 모델 설정
    llm = ChatOpenAI(model="gpt-4o", temperature=0)

    # Context 포맷팅 함수
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    # 8. RAG 체인 구성
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain