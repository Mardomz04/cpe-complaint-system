import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function QRCodeBox() {
  const [show, setShow] = useState(false);

  const complaintLink = 'https://cpe-complaint-system.vercel.app/complaint';

  return (
    <div
      className="qr-floating"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      <div className="qr-button">
        QR
      </div>

      {show && (
        <div className="qr-popup">
          <p>Scan to submit complaint</p>
          <QRCodeCanvas value={complaintLink} size={160} />
        </div>
      )}
    </div>
  );
}

export default QRCodeBox;
