// StatCard.js
import React from 'react';
import { Table } from 'react-bootstrap';

const StatCard = ({ title, value, description }) => {
  return (
    <Table bordered className="stat-table">
      <thead>
        <tr>
          <th>{title}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{value}</td>
        </tr>
        <tr>
          <td>{description}</td>
        </tr>
      </tbody>
    </Table>
  );
};

export default StatCard;