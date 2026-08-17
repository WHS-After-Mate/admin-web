import streamlit as st
from dotenv import load_dotenv
from rag_module import create_rag_chain

# .env 환경 변수 로드
load_dotenv()

st.set_page_config(page_title="PDF RAG Q&A System", page_icon="📚")
st.title("📚 AI 에이전트 문서 기반 Q&A 시스템")

# 사이드바에서 PDF 파일 업로드
with st.sidebar:
    st.header("📄 문서 업로드")
    uploaded_file = st.file_uploader("PDF 파일을 선택하세요", type=["pdf"])

if uploaded_file is not None:
    if "rag_chain" not in st.session_state or st.session_state.get("file_name") != uploaded_file.name:
        with st.spinner("문서를 분석하고 벡터 DB를 구축 중입니다..."):
            st.session_state.rag_chain = create_rag_chain(uploaded_file)
            st.session_state.file_name = uploaded_file.name
            st.session_state.messages = []
        st.success("문서 분석 완료!")

    # 메시지 기록 세션 초기화
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # 이전 대화 내용 출력
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # 사용자 질문 입력
    if prompt := st.chat_input("문서에 대해 질문해 주세요!"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        # AI 답변 생성
        with st.chat_message("assistant"):
            with st.spinner("답변을 생성 중입니다..."):
                response = st.session_state.rag_chain.invoke(prompt)
                st.markdown(response)
        
        st.session_state.messages.append({"role": "assistant", "content": response})

else:
    st.info("왼쪽 사이드바에서 PDF 파일을 업로드해주세요.")