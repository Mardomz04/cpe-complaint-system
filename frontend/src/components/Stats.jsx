import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import api from '../api';

const percentageLabelPlugin = {
  id: 'percentageLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);

    if (!dataset || !meta) return;

    const total = dataset.data.reduce((sum, value) => sum + value, 0);
    if (total === 0) return;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    meta.data.forEach((element, index) => {
      const value = dataset.data[index];
      const percentage = ((value / total) * 100).toFixed(1);

      if (percentage <= 0) return;

      const position = element.tooltipPosition();
      ctx.fillText(`${percentage}%`, position.x, position.y);
    });

    ctx.restore();
  }
};

function Stats() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState(1);
  const [isLightMode, setIsLightMode] = useState(
    document.body.classList.contains('light-mode')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.body.classList.contains('light-mode'));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const fetchStats = (instructorId) => {
    api.get(`/complaints/stats/${instructorId}`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  };

  const fetchSummary = () => {
    api.get('/complaints/analytics/summary')
      .then(res => setSummary(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    api.get('/instructors')
      .then(res => {
        setInstructors(res.data);

        if (res.data.length > 0) {
          setSelectedInstructor(res.data[0].instructor_id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedInstructor) return;

    fetchStats(selectedInstructor);
    fetchSummary();

    const interval = setInterval(() => {
      fetchStats(selectedInstructor);
      fetchSummary();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedInstructor]);

  if (!data || !summary) {
    return (
      <div className="card">
        <p>Loading...</p>
      </div>
    );
  }

  const categories = data.categories || [];
  const severity = data.severity || [];

  const topCategory = categories.length > 0
    ? categories.reduce((prev, curr) =>
        prev.count > curr.count ? prev : curr
      )
    : null;

  const complaintHandlingStatus =
    summary.pending > summary.resolved ? 'pending' : 'resolved';

  const complaintHandlingMeaning =
    summary.pending > summary.resolved ? 'delayed resolution' : 'effective handling';

  const chartTextColor = isLightMode ? '#0f172a' : '#ffffff';
  const chartBorderColor = isLightMode ? '#ffffff' : '#ffffff';

  const categoryChart = {
    labels: categories.map(c => c.category || 'Uncategorized'),
    datasets: [
      {
        label: 'Complaint Categories',
        data: categories.map(c => c.count),
        backgroundColor: ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7'],
        borderColor: chartBorderColor,
        borderWidth: 2
      }
    ]
  };

  const severityChart = {
    labels: severity.map(s => s.severity_level || 'None'),
    datasets: [
      {
        label: 'Severity Levels',
        data: severity.map(s => s.count),
        backgroundColor: severity.map(s => {
          const level = (s.severity_level || 'none').toLowerCase();

          if (level === 'high') return '#ef4444';
          if (level === 'medium') return '#facc15';
          if (level === 'low') return '#22c55e';
          return '#9ca3af';
        }),
        borderColor: chartBorderColor,
        borderWidth: 2
      }
    ]
  };

  const pieOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor,
          font: {
            size: 13,
            weight: 'bold'
          },
          boxWidth: 38,
          padding: 14
        }
      },
      tooltip: {
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        backgroundColor: '#020617'
      }
    }
  };

  return (
    <div className="card">
      <div className="analytics-grid">
        <div className="analytics-card blue">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="analytics-card yellow">
          <span>Pending</span>
          <strong>{summary.pending}</strong>
        </div>

        <div className="analytics-card green">
          <span>Resolved</span>
          <strong>{summary.resolved}</strong>
        </div>

        <div className="analytics-card red">
          <span>Rejected</span>
          <strong>{summary.rejected}</strong>
        </div>
      </div>

      <div className="insight-summary">
        <p>
          Most complaints are currently
          <strong> {complaintHandlingStatus} </strong>
          which indicates
          <strong> {complaintHandlingMeaning} </strong>.
        </p>
      </div>

      <div className="insight-row">
        <div className="insight-box">
          <span>Most Reported Instructor</span>
          <strong>
            {summary.topInstructor
              ? `${summary.topInstructor.instructor_name} (${summary.topInstructor.count})`
              : 'No data yet'}
          </strong>
        </div>

        <div className="insight-box">
          <span>Overall Top Category</span>
          <strong>
            {summary.topCategory
              ? `${summary.topCategory.category} (${summary.topCategory.count})`
              : 'No data yet'}
          </strong>
        </div>
      </div>

      <div className="stats-header">
        <div className="total-box">
          Selected Instructor Complaints: {data.total}
        </div>

        <div>
          <label>Select Instructor: </label>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
          >
            {instructors.map((inst) => (
              <option key={inst.instructor_id} value={inst.instructor_id}>
                {inst.instructor_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {topCategory && (
        <div className="highlight-card">
          <h3>Top Category for Selected Instructor</h3>
          <p>{topCategory.category} ({topCategory.count})</p>
        </div>
      )}

      <div className="chart-row">
        <div className="chart-panel">
          <h3>Complaint Categories</h3>
          <div className="chart-box">
            <Pie
              data={categoryChart}
              options={pieOptions}
              plugins={[percentageLabelPlugin]}
            />
          </div>
        </div>

        <div className="chart-panel">
          <h3>Severity Levels</h3>
          <div className="chart-box">
            <Pie
              data={severityChart}
              options={pieOptions}
              plugins={[percentageLabelPlugin]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;