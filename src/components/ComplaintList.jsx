import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [toast, setToast] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');
  const [instructorFilter, setInstructorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchComplaints = () => {
    api.get('/complaints')
      .then(res => setComplaints(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchComplaints();

    const interval = setInterval(fetchComplaints, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const updateStatus = (complaintId, newStatus) => {
    api.put(`/complaints/${complaintId}/status`, { status: newStatus })
      .then(() => {
        fetchComplaints();
        showToast(`Complaint status updated to ${newStatus}.`);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to update complaint status.');
      });
  };

  const instructors = [...new Set(complaints.map(c => c.instructor_name))];
  const categories = [...new Set(complaints.map(c => c.category))];

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesStatus =
      statusFilter === 'All' || complaint.status === statusFilter;

    const matchesInstructor =
      instructorFilter === 'All' || complaint.instructor_name === instructorFilter;

    const matchesCategory =
      categoryFilter === 'All' || complaint.category === categoryFilter;

    return matchesStatus && matchesInstructor && matchesCategory;
  });

  const countByField = (field) => {
    const counts = {};

    filteredComplaints.forEach(item => {
      const key = item[field] || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  };

  const drawBarChart = (doc, title, data, startY) => {
    doc.setFontSize(12);
    doc.text(title, 14, startY);

    if (data.length === 0) {
      doc.setFontSize(9);
      doc.text('No data available.', 14, startY + 8);
      return startY + 16;
    }

    const maxCount = Math.max(...data.map(d => d.count));
    let y = startY + 8;

    data.forEach((item) => {
      const barWidth = (item.count / maxCount) * 90;

      doc.setFontSize(8);
      doc.text(`${item.label} (${item.count})`, 14, y + 4);

      doc.setFillColor(37, 99, 235);
      doc.rect(70, y, barWidth, 5, 'F');

      y += 9;
    });

    return y + 5;
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const logo = new Image();
    logo.src = '/logo.png';

    logo.onload = () => {
      doc.addImage(logo, 'PNG', 14, 10, 22, 22);

      doc.setFontSize(16);
      doc.text('CPE Complaint Report', 42, 18);

      doc.setFontSize(9);
      doc.text('Anonymous Complaint Monitoring System', 42, 24);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 42, 30);

      doc.setFontSize(10);
      doc.text(`Filters: Status = ${statusFilter}, Instructor = ${instructorFilter}, Category = ${categoryFilter}`, 14, 42);

      doc.setFontSize(12);
      doc.text('Summary', 14, 54);

      doc.setFontSize(10);
      doc.text(`Total Records: ${filteredComplaints.length}`, 14, 62);
      doc.text(`Pending: ${filteredComplaints.filter(c => c.status === 'Pending').length}`, 60, 62);
      doc.text(`Resolved: ${filteredComplaints.filter(c => c.status === 'Resolved').length}`, 105, 62);
      doc.text(`Rejected: ${filteredComplaints.filter(c => c.status === 'Rejected').length}`, 155, 62);

      let nextY = 76;
      nextY = drawBarChart(doc, 'Complaints by Category', countByField('category'), nextY);
      nextY = drawBarChart(doc, 'Complaints by Severity', countByField('severity_level'), nextY + 4);
      nextY = drawBarChart(doc, 'Complaints by Status', countByField('status'), nextY + 4);

      autoTable(doc, {
        startY: nextY + 8,
        head: [[
          'Subject',
          'Instructor',
          'Category',
          'Severity',
          'Status',
          'Date',
          'Message'
        ]],
        body: filteredComplaints.map(c => [
          c.subject_code,
          c.instructor_name,
          c.category,
          c.severity_level,
          c.status,
          new Date(c.created_at).toLocaleString(),
          c.complaint_message
        ]),
        styles: {
          fontSize: 7,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      doc.save('cpe_complaint_report.pdf');
      showToast('PDF report exported successfully.');
    };

    logo.onerror = () => {
      showToast('Logo not found. Put logo.png inside frontend/public.');
    };
  };

  return (
    <div className="card">
      <h2>Complaint Records</h2>

      {toast && <div className="toast">{toast}</div>}

      <div className="filter-row">
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Pending</option>
            <option>Resolved</option>
            <option>Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Instructor</label>
          <select value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)}>
            <option>All</option>
            {instructors.map(instructor => (
              <option key={instructor}>{instructor}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option>All</option>
            {categories.map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="export-row">
        <p className="record-count">
          Showing {filteredComplaints.length} of {complaints.length} complaints
        </p>

        <button
          type="button"
          className="export-btn"
          onClick={exportPDF}
          disabled={filteredComplaints.length === 0}
        >
          Export PDF Report
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Instructor</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan="8">No complaints found. Try adjusting filters or wait for new submissions.</td>
              </tr>
            ) : (
              filteredComplaints.map((complaint) => (
                <tr key={complaint.complaint_id}>
                  <td>{complaint.subject_code}</td>
                  <td>{complaint.instructor_name}</td>
                  <td>{complaint.category}</td>
                  <td>{complaint.severity_level}</td>
                  <td>{complaint.complaint_message}</td>
                  <td>
                    <span className={`status ${complaint.status.toLowerCase()}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td>{new Date(complaint.created_at).toLocaleString()}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="small-btn pending-btn"
                        onClick={() => updateStatus(complaint.complaint_id, 'Pending')}
                      >
                        Pending
                      </button>

                      <button
                        type="button"
                        className="small-btn resolve-btn"
                        onClick={() => updateStatus(complaint.complaint_id, 'Resolved')}
                      >
                        Resolve
                      </button>

                      <button
                        type="button"
                        className="small-btn reject-btn"
                        onClick={() => updateStatus(complaint.complaint_id, 'Rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ComplaintList;