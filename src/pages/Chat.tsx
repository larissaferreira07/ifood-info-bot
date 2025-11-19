import { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { DisclaimerDialog, checkDisclaimerAccepted } from '@/components/DisclaimerBanner';

const Chat = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (!checkDisclaimerAccepted()) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <DisclaimerDialog open={showDisclaimer} onAccept={handleDisclaimerAccept} />
      <ChatContainer />
    </div>
  );
};

export default Chat;
