import React from 'react';

function RightSidebar() {
  return (
    <div className="col-3 p-3 position-fixed" style={{ top: '60px', right: '0', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <h3 className="text-secondary mb-3">Contacts</h3>
      <ul className="list-unstyled">
        <li className="mb-3 d-flex align-items-center gap-2">
          <img
            src="/img/logo.png"
            alt="Contact"
            className="rounded-circle"
            style={{ width: '30px', height: '30px' }}
          />
          <span>Melody</span>
        </li>
        <li className="mb-3 d-flex align-items-center gap-2">
          <img
            src="/img/logo.png"
            alt="Contact"
            className="rounded-circle"
            style={{ width: '30px', height: '30px' }}
          />
          <span>Ken Wang</span>
        </li>
        <li className="mb-3 d-flex align-items-center gap-2">
          <img
            src="/img/logo.png"
            alt="Contact"
            className="rounded-circle"
            style={{ width: '30px', height: '30px' }}
          />
          <span>Leona</span>
        </li>
      </ul>
    </div>
  );
}

export default RightSidebar;