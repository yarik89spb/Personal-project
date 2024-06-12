import { useState, useEffect, ChangeEvent } from 'react';
import { useSocket, sendMessage, useCommandListener } from '../utils/websocket';
import EventScreen from './EventScreen';
import AlwaysScrollToBottom from './AlwaysScrollToBottom';
import './GuestView.css'

function GuestView() {
  let userComments = [
    {author: 'John', content:'Hi'},
    {author:'Amy', content:'Wow'}, 
    {author:'Bot', content:'Greeting'}
  ];

  const [commentsArray, setComments] =  useState(userComments);
  const [userMessageInput, setUserMessageInput] = useState('');
  const [currentScreen, setCurrentScreen] = useState<Question>({
    content: 'Please, stand by...',
    options: []
  });


  const socket = useSocket('http://localhost:3000/'); 

  function addMessageToChat(){
    let commentsArrayUpdated = [...commentsArray]
    commentsArrayUpdated.push({
      author: 'user', 
      content:userMessageInput
    });
    setComments(commentsArrayUpdated);
    setUserMessageInput('');
    sendMessage(socket, userMessageInput);
  }

  useEffect(() => { 
    renderComments(commentsArray);
  }, [commentsArray]);

  interface Option{
    // 一個選擇
    text: string;
    isCorrect: boolean;
  }
  
  interface Question{
    // 題目的問題
    content: string;
    options: Option[];
  }

  useCommandListener(socket, 'changeScreen', (passedData: object) => {
    const questionData = passedData as Question;
    setCurrentScreen(questionData);
  });

  function storeUserMessageInput(e: ChangeEvent<HTMLInputElement>){
    setUserMessageInput(e.target.value);
  }

  interface Comment {
    author: string;
    content: string;
  }

  function renderComments(comments: Comment[]){
    return (
      <ul className='list-group list-group-numbered"'>
      {comments.map((comment, index) => (
        <li key={index} className='list-group-item d-flex justify-content-between align-items-start'>
          <div className="text-wrap" style={{width: '30rem'}}>
            {comment.author}
          </div>
          <div className="text-wrap" style={{width: '30rem'}}>
            {comment.content}
          </div>
        </li>
      ))}
    </ul>
    )
  }

  return (
      <div className='container' id='chat-container'>
        <EventScreen question={currentScreen} />
        <div className='card'>
          <h3 className='card-header'>Chat:</h3>
          <div className='card-body' style={{ height: '400px', maxHeight: '400px', overflowY: 'auto' }} id='comments-container'>
            <AlwaysScrollToBottom>
              {renderComments(commentsArray)}
            </AlwaysScrollToBottom>
          </div>
          <div className='card-footer'>
            <div id='messenger' className='input-group'>
              <input
                type='text'
                placeholder="...Type your message"
                className='form-control'
                value={userMessageInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    addMessageToChat();
                  }}
                onChange={(event) => storeUserMessageInput(event)}
              />
              <button
                type='button'
                className='btn btn-primary'
                onClick={()=>addMessageToChat()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}

export default GuestView;