/**
 * AdminContent 頁面 - 內容管理
 * @module pages/admin/AdminContent
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState } from "react";
import { PillButton, Input, Textarea } from "@/components/ui";

interface ContentSection {
  id: string;
  name: string;
  key: string;
  content: string;
}

/**
 * AdminContent - 內容管理頁面
 *
 * @returns {JSX.Element} 內容管理頁面
 */
const AdminContent: React.FC = () => {
  const [sections] = useState<ContentSection[]>([
    {
      id: "1",
      name: "首頁標語",
      key: "hero_title",
      content: "打造理想體態，遇見更好的自己",
    },
    {
      id: "2",
      name: "首頁副標",
      key: "hero_subtitle",
      content: "專業一對一健身指導，量身打造訓練計畫",
    },
    {
      id: "3",
      name: "關於教練",
      key: "about_coach",
      content: "擁有超過 10 年健身教學經驗...",
    },
  ]);

  const [selectedSection, setSelectedSection] = useState<ContentSection | null>(
    null,
  );
  const [editContent, setEditContent] = useState("");

  const handleEdit = (section: ContentSection) => {
    setSelectedSection(section);
    setEditContent(section.content);
  };

  const handleSave = () => {
    // Simulate save
    console.log("Saving:", selectedSection?.key, editContent);
    setSelectedSection(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-luxe-text">內容管理</h1>
        <p className="text-luxe-muted">管理網站文案內容</p>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <h3 className="text-luxe-text font-medium mb-1">
                  {section.name}
                </h3>
                <p className="text-luxe-muted text-sm mb-3">
                  Key: {section.key}
                </p>
                <p className="text-luxe-text/80">{section.content}</p>
              </div>
              <PillButton
                theme="luxe"
                variant="outline"
                size="sm"
                onClick={() => handleEdit(section)}
              >
                編輯
              </PillButton>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Panel */}
      {selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedSection(null)}
          />
          <div className="relative bg-luxe-bg border border-luxe-gold/20 rounded-lg p-6 max-w-2xl w-full shadow-2xl">
            <h2 className="text-xl text-luxe-text font-light mb-6">
              編輯 - {selectedSection.name}
            </h2>
            <div className="space-y-4">
              <Input
                label="Key"
                value={selectedSection.key}
                disabled
                theme="luxe"
              />
              <Textarea
                label="內容"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                theme="luxe"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setSelectedSection(null)}
              >
                取消
              </PillButton>
              <PillButton theme="luxe" variant="filled" onClick={handleSave}>
                儲存
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
