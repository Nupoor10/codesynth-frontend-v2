import React from 'react';
import "./CoderMate.css";

const CoderMate = () => {
  return (
    <div className="botpress__body">
    <div>
      <p>Meet CoderMate, your helpful coding companion!</p>
      <p>With codermate, you can learn web developement, ask you doubts, get project ideas and much more!</p>
    </div>
    <div className="center-div">
      <iframe title='coder__mate' className="iframe__component" srcDoc="<body><script src='https://cdn.botpress.cloud/webchat/v0/inject.js'></script>
        <script>
          window.botpressWebChat.init({
              'composerPlaceholder': 'Unleash your curiosity, start learning!',
              'botConversationDescription': 'Explore coding concepts, get code recommendations, and collaborate with me to enhance your programming skills and build amazing projects.💻🚀',
              'botId': '0867c096-451d-4fb4-b337-dbc404adabe8',
              'hostUrl': 'https://cdn.botpress.cloud/webchat/v0',
              'messagingUrl': 'https://messaging.botpress.cloud',
              'clientId': '0867c096-451d-4fb4-b337-dbc404adabe8',
              'botName': 'CoderMate🤖',
              'avatarUrl': 'https://i.ibb.co/RHRtQNb/Chat-bot-bro.png',
              'frontendVersion': 'v1',
              'showBotInfoPage': true,                  
              'enableConversationDeletion': true,
              'showPoweredBy': true,
              'className': 'webchatIframe',
              'containerWidth': '100%25',
              'layoutWidth': '100%25',
              'hideWidget': true,
              'showCloseButton': false,
              'disableAnimations': true,
              'closeOnEscape': false,
              'showConversationsButton': false,
              'enableTranscriptDownload': false,
              'stylesheet':'https://webchat-styler-css.botpress.app/prod/code/3fcd3e4e-d5bc-4bf5-8699-14b621b3ada2/v31782/style.css'
          });
        window.botpressWebChat.onEvent(function () { window.botpressWebChat.sendEvent({ type: 'show' }) }, ['LIFECYCLE.LOADED']);
        </script></body>">
        </iframe>
      </div>
    </div>
  )
}

export default CoderMate