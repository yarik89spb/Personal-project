import { useState, useEffect} from 'react';
import { useSocket, useMessageListener, sendCommand, useAnswerListener, useEmojiListener } from '../utils/websocket';
import { useParams } from 'react-router-dom';
import EventScreen from './EventScreen';
import ChatComments from './ChatComments';
import AlwaysScrollToBottom from './AlwaysScrollToBottom';
import { Option,  Comment } from '../utils/interfaces.ts';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HostView.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';

function HostView(){
  let userComments = [
    {userName:'Bot', text:'請大家盡量留言和回答問題', questionId: 11}
  ];
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    throw new Error('Project ID is required');
  }

  const [projectData, setProjectData] = useState({
    projectName: 'Missing',
    projectId: null,
    questions:[]});
  const [questionIndex, setQuestionIndex] =  useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [commentsArray, setComments] =  useState(userComments);
  const [answersArray, setAnswers] =  useState<Option[]>([]);
  const socket = useSocket(`${import.meta.env.VITE_API_BASE_URL}`, projectId);
  const [selectedEmoji, setSelectedEmoji] = useState("");

  /* Project data rendering and broadcasting */

  useEffect(() => {
    async function fetchData(){
      try{
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/project-data?projectId=${projectId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const newProjectData = await response.json();
        setIsLoadingQuestions(false);
        setProjectData(newProjectData.data);
      } catch(error){
        console.error(`Failed to get project data. ${error}`)
        setIsLoadingQuestions(false);
      }
    }
    fetchData();
  }, [])

  function handleQuestionIndexChange(isForward = true){
    const maxIndex = projectData.questions.length - 1;
    if (isForward){
      const newIndex = questionIndex + 1;
      if (newIndex <= maxIndex) {
        setQuestionIndex(newIndex);
      }else {
        setQuestionIndex(0);
      }
    }else{
      const newIndex = questionIndex - 1;
      if (newIndex > 0){
        setQuestionIndex(newIndex);
      }else {
        setQuestionIndex(maxIndex);
      }
    }
  }

  function changeScreen(){
    sendCommand(socket, 'changeScreen', {
      roomId: projectId,
      passedData: projectData.questions[questionIndex]
    })
  }

  useEffect(() => { 
    changeScreen();
    setAnswers([]);
  }, [questionIndex]);

  function handleBroadcastingState(isBroadcasting = false){
    if(isBroadcasting){
      sendCommand(socket, 'startBroadcasting', {
        roomId: projectId,
        passedData:{}})
      changeScreen()
    }else{
      sendCommand(socket, 'stopBroadcasting', {
        roomId: projectId,
        passedData:{}})
    }
  }


  /* Receiving viewers' comments and reactions */

  useMessageListener(socket, 'viewerMessage', (message: Comment) => {
    addMessageToChat({
      userName: message.userName, 
      text: message.text, 
      questionId: message.questionId });
  });

  function addMessageToChat(comment: Comment){
    setComments((prevComments) => [...prevComments, comment]);
  }

  useAnswerListener(socket, 'userAnswer', (userAnswer:Option) => {
    setAnswers((prevAnswers) => [...prevAnswers, userAnswer]);
    //console.log(answersArray);
    renderAnswers();
  });

  const handleEmojiClick = (emoji: string) => {
    setSelectedEmoji(emoji);
    setTimeout(() => setSelectedEmoji(''), 1000); // Reset the selected emoji after animation
  };

  useEmojiListener(socket, 'userEmoji', (emoji:string) => {
    console.log(emoji)
    handleEmojiClick(emoji);
    setTimeout(() => setSelectedEmoji(''), 1000);
  });

  function renderAnswers(){
    return(
      <div>
        <div>Answers submitted</div>
        <div>{answersArray.length}</div>
      </div>
    )
  }

  // useEffect(() =>{
  //   renderAnswers();
  // }, [answersArray])

  
  return (
    <div className='container'> 
      <div className='row'>
        <div className='col-md-6'>
          <div className='card'> 
            <h3 className='card-header' >User comments:</h3>
            <div className='card-body' style={{ height: '300px', maxHeight: '300px', overflowY: 'auto' }}>
              <AlwaysScrollToBottom>
                <ChatComments comments={commentsArray}/>
              </AlwaysScrollToBottom>
            </div>
          </div>
        </div>
        <div className='col-md-6'>
          <div className='event-screen'>
            {isLoadingQuestions === false && (
                <EventScreen
                  question={projectData.questions[questionIndex]}
                  onOptionClick={() => {
                    return;
                  }}
                />
              )
            }
          </div>
          <div>
            {renderAnswers()}
          </div>
          <div className='user-emoji-container'>
            <button className={`reaction-button ${selectedEmoji === 'heart' ? 'selected' : ''}`} onClick={() => handleEmojiClick('heart')}>
              <FontAwesomeIcon icon={faHeart} />
            </button>
            <button className={`reaction-button ${selectedEmoji === 'like' ? 'selected' : ''}`} onClick={() => handleEmojiClick('like')}>
              <FontAwesomeIcon icon={faThumbsUp} />
            </button>
            <button className={`reaction-button ${selectedEmoji === 'dislike' ? 'selected' : ''}`} onClick={() => handleEmojiClick('dislike')}>
              <FontAwesomeIcon icon={faThumbsDown} />
            </button>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center">
      <div className="btn-group" role="group" aria-label="Control Buttons">
        <button type="button" className="btn btn-primary btn-lg mx-2" onClick={() => handleQuestionIndexChange(false)}>
          &lt;
        </button>
        <button type="button" className="btn btn-success btn-lg mx-2" onClick={() => handleBroadcastingState(true)}>
          Start
        </button>
        <button type="button" className="btn btn-danger btn-lg mx-2" onClick={() => handleBroadcastingState(false)}>
          Stop
        </button>
        <button type="button" className="btn btn-primary btn-lg mx-2" onClick={() => handleQuestionIndexChange(true)}>
          &gt;
        </button>
      </div>
    </div>
    </div> 
  )
}

export default HostView
