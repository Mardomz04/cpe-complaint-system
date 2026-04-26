import { useEffect } from 'react';

function QRRedirect() {
  useEffect(() => {
    const target = `${window.location.origin}/complaint`;

    setTimeout(() => {
      window.location.replace(target);
    }, 300);
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Redirecting to Complaint Form...</h2>
      <p>Please wait a moment...</p>
    </div>
  );
}

export default QRRedirect;