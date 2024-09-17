import React, { useState } from 'react';
import './ApologyForm.css';

const ApologyForm: React.FC = () => {
  const [formData, setFormData] = useState({
    recipient: '',
    senderName: '',
    senderRole: '',
    reason: '',
    wordCount: '',
    style: '',
  });
  const [apologyImage, setApologyImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/generate-apology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setApologyImage(data.imageUrl);
    } catch (error) {
      console.error('Error generating apology:', error);
      alert('生成道歉信时出错，请稍后再试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="apology-form-container">
      <form onSubmit={handleSubmit} className="apology-form">
        <div className="form-group">
          <label htmlFor="recipient">道歉对象：</label>
          <input
            type="text"
            id="recipient"
            name="recipient"
            value={formData.recipient}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="senderName">道歉人姓名：</label>
          <input
            type="text"
            id="senderName"
            name="senderName"
            value={formData.senderName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="senderRole">道歉人角色：</label>
          <input
            type="text"
            id="senderRole"
            name="senderRole"
            value={formData.senderRole}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reason">道歉原因：</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="wordCount">道歉信字数：</label>
          <input
            type="number"
            id="wordCount"
            name="wordCount"
            value={formData.wordCount}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="style">道歉风格：</label>
          <input
            type="text"
            id="style"
            name="style"
            value={formData.style}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? '生成中...' : '生成道歉信'}
        </button>
      </form>
      {apologyImage && (
        <div className="apology-image">
          <img src={apologyImage} alt="道歉信" />
          <a href={apologyImage} download="apology_letter.jpg" className="download-button">
            下载道歉信
          </a>
        </div>
      )}
    </div>
  );
};

export default ApologyForm;