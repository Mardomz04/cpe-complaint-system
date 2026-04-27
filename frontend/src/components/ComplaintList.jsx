import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('Pending');
  const [toast, setToast] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');
  const [instructorFilter, setInstructorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

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

  const getRowClass = (complaint) => {
    if (complaint.severity_level === 'High') return 'severity-high';
    if (complaint.severity_level === 'Medium') return 'severity-medium';
    if (complaint.severity_level === 'Low') return 'severity-low';
    if (complaint.sentiment === 'Positive') return 'sentiment-positive';
    return '';
  };

  const instructors = [...new Set(complaints.map(c => c.instructor_name).filter(Boolean))];
  const categories = [...new Set(complaints.map(c => c.ai_category).filter(Boolean))];
  const sentiments = [...new Set(complaints.map(c => c.sentiment).filter(Boolean))];
  const severities = [...new Set(complaints.map(c => c.severity_level).filter(Boolean))];

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesStatus =
      statusFilter === 'All' || complaint.status === statusFilter;

    const matchesInstructor =
      instructorFilter === 'All' || complaint.instructor_name === instructorFilter;

    const matchesCategory =
      categoryFilter === 'All' || complaint.ai_category === categoryFilter;

    const matchesSentiment =
      sentimentFilter === 'All' || complaint.sentiment === sentimentFilter;

    const matchesSeverity =
      severityFilter === 'All' || complaint.severity_level === severityFilter;

    return (
      matchesStatus &&
      matchesInstructor &&
      matchesCategory &&
      matchesSentiment &&
      matchesSeverity
    );
  });

  const filteredComplaintIds = filteredComplaints.map(c => c.complaint_id);

  const toggleSelectComplaint = (complaintId) => {
    setSelectedComplaints(prev =>
      prev.includes(complaintId)
        ? prev.filter(id => id !== complaintId)
        : [...prev, complaintId]
    );
  };

  const toggleSelectAll = () => {
    const allSelected =
      filteredComplaintIds.length > 0 &&
      filteredComplaintIds.every(id => selectedComplaints.includes(id));

    if (allSelected) {
      setSelectedComplaints(prev =>
        prev.filter(id => !filteredComplaintIds.includes(id))
      );
    } else {
      setSelectedComplaints(prev => [
        ...new Set([...prev, ...filteredComplaintIds])
      ]);
    }
  };

  const handleBulkStatusUpdate = () => {
    if (selectedComplaints.length === 0) {
      showToast('Please select at least one feedback.');
      return;
    }

    api.put('/complaints/bulk/status', {
      complaint_ids: selectedComplaints,
      status: bulkStatus
    })
      .then(() => {
        showToast(`Selected feedback marked as ${bulkStatus}.`);
        setSelectedComplaints([]);
        fetchComplaints();
      })
      .catch(err => {
        console.error(err);
        showToast(err.response?.data?.error || 'Failed to update selected feedback.');
      });
  };

  const handleBulkDelete = () => {
    if (selectedComplaints.length === 0) {
      showToast('Please select at least one feedback.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedComplaints.length} selected feedback response(s)? This cannot be undone.`
    );

    if (!confirmDelete) return;

    api.post('/complaints/bulk/delete', {
      complaint_ids: selectedComplaints
    })
      .then(() => {
        showToast('Selected feedback responses deleted successfully.');
        setSelectedComplaints([]);
        fetchComplaints();
      })
      .catch(err => {
        console.error(err);
        showToast(err.response?.data?.error || 'Failed to delete selected feedback.');
      });
  };

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
      doc.text('CPE Feedback Report', 42, 18);

      doc.setFontSize(9);
      doc.text('Anonymous Feedback Monitoring System', 42, 24);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 42, 30);

      doc.setFontSize(9);
      doc.text(
        `Filters: Status = ${statusFilter}, Instructor = ${instructorFilter}, Category = ${categoryFilter}, Sentiment = ${sentimentFilter}, Severity = ${severityFilter}`,
        14,
        42
      );

      doc.setFontSize(12);
      doc.text('Summary', 14, 54);

      doc.setFontSize(10);
      doc.text(`Total Records: ${filteredComplaints.length}`, 14, 62);
      doc.text(`Pending: ${filteredComplaints.filter(c => c.status === 'Pending').length}`, 60, 62);
      doc.text(`Resolved: ${filteredComplaints.filter(c => c.status === 'Resolved').length}`, 105, 62);
      doc.text(`Rejected: ${filteredComplaints.filter(c => c.status === 'Rejected').length}`, 155, 62);

      let nextY = 76;
      nextY = drawBarChart(doc, 'Feedback by AI Category', countByField('ai_category'), nextY);
      nextY = drawBarChart(doc, 'Feedback by Sentiment', countByField('sentiment'), nextY + 4);
      nextY = drawBarChart(doc, 'Feedback by Severity', countByField('severity_level'), nextY + 4);
      nextY = drawBarChart(doc, 'Feedback by Status', countByField('status'), nextY + 4);

      autoTable(doc, {
        startY: nextY + 8,
        head: [[
          'Subject',
          'Instructor',
          'Sentiment',
          'AI Category',
          'Severity',
          'Status',
          'Date',
          'Message',
          'AI Reason'
        ]],
        body: filteredComplaints.map(c => [
          c.subject_code,
          c.instructor_name,
          c.sentiment || 'Neutral',
          c.ai_category || 'Uncategorized',
          c.severity_level || 'None',
          c.status,
          new Date(c.created_at).toLocaleString(),
          c.complaint_message,
          c.ai_severity_reason || 'No reason'
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

      doc.save('cpe_feedback_report.pdf');
      showToast('PDF report exported successfully.');
    };

    logo.onerror = () => {
      showToast('Logo not found. Put logo.png inside frontend/public.');
    };
  };

  const allFilteredSelected =
    filteredComplaintIds.length > 0 &&
    filteredComplaintIds.every(id => selectedComplaints.includes(id));

  return (
    <div className="card">
      <h2>Feedback Records</h2>

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
          <label>AI Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option>All</option>
            {categories.map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sentiment</label>
          <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
            <option>All</option>
            {sentiments.map(sentiment => (
              <option key={sentiment}>{sentiment}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Severity</label>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option>All</option>
            {severities.map(severity => (
              <option key={severity}>{severity}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bulk-action-row">
        <div className="bulk-left">
          <strong>{selectedComplaints.length}</strong> selected
        </div>

        <div className="bulk-controls">
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            disabled={selectedComplaints.length === 0}
          >
            <option>Pending</option>
            <option>Resolved</option>
            <option>Rejected</option>
          </select>

          <button
            type="button"
            className="small-btn resolve-btn"
            onClick={handleBulkStatusUpdate}
            disabled={selectedComplaints.length === 0}
          >
            Apply Status
          </button>

          <button
            type="button"
            className="small-btn delete-btn"
            onClick={handleBulkDelete}
            disabled={selectedComplaints.length === 0}
          >
            Delete Selected
          </button>
        </div>
      </div>

      <div className="export-row">
        <p className="record-count">
          Showing {filteredComplaints.length} of {complaints.length} feedback
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
              <th>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  disabled={filteredComplaints.length === 0}
                />
              </th>
              <th>Subject</th>
              <th>Instructor</th>
              <th>Sentiment</th>
              <th>AI Category</th>
              <th>Severity</th>
              <th>Message</th>
              <th>AI Reason</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan="10">No feedback found. Try adjusting filters or wait for new submissions.</td>
              </tr>
            ) : (
              filteredComplaints.map((complaint) => (
                <tr
                  key={complaint.complaint_id}
                  className={getRowClass(complaint)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedComplaints.includes(complaint.complaint_id)}
                      onChange={() => toggleSelectComplaint(complaint.complaint_id)}
                    />
                  </td>
                  <td>{complaint.subject_code}</td>
                  <td>{complaint.instructor_name}</td>
                  <td>{complaint.sentiment || 'Neutral'}</td>
                  <td>{complaint.ai_category || 'Uncategorized'}</td>
                  <td>
                    <span className={`severity-badge ${(complaint.severity_level || 'none').toLowerCase()}`}>
                      {complaint.severity_level || 'None'}
                    </span>
                  </td>
                  <td>{complaint.complaint_message}</td>
                  <td>{complaint.ai_severity_reason || 'No reason'}</td>
                  <td>
                    <span className={`status ${(complaint.status || 'Pending').toLowerCase()}`}>
                      {complaint.status || 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(complaint.created_at).toLocaleString()}</td>
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