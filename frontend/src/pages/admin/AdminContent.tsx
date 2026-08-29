/**
 * AdminContent 頁面 - 內容管理
 * 管理網站文案內容 + 首頁彈窗
 *
 * @module pages/admin/AdminContent
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  PillButton,
  Input,
  Textarea,
  Modal,
  useDialog,
  ImageInput,
  ImageUploadTargetProvider,
} from '@/components/ui';
import { Toggle, TagInput } from '@/components/ui/form';
// 直接具名 import：避免 tiptap 經由 ui barrel 汙染前台主 chunk
import { RichTextEditor } from '@/components/ui/editor';
import {
  contentService,
  type SiteContent,
  type SitePopup,
} from '@/services/site/content.service';
import {
  slidesService,
  type TestimonialSlide,
  type TestimonialConfig,
  type TestimonialCardLayout,
  type GallerySlide,
  type GalleryConfig,
} from '@/services/site/slides.service';
import {
  marqueeService,
  type MarqueeItem,
  type MarqueeType,
} from '@/services/site/marquee.service';
import {
  podcastService,
  type PodcastEpisode,
  type EpisodeCategory,
  EPISODE_CATEGORIES,
} from '@/services/site/podcast.service';
import { TestimonialCarousel } from '@/components/sections';
import { GallerySlider } from '@/components/sections';
import { getTemplates, type ContentTemplate } from '@/utils/contentTemplates';
import { HOMEPAGE_SECTIONS, KEY_TO_SECTION_ID } from '@/utils/homepageSections';
import { isAllowedImageUrl } from '@/lib/imageUrl';

/** 用 chip / tag 編輯器呈現的 JSON 字串陣列 keys */
const STRING_ARRAY_KEYS = new Set<string>([
  'hero_flip_words',
  'coach_intro_bullets',
]);


/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[AdminContent] ${msg}`, data || ''),
  error: (msg: string, err?: unknown) =>
    console.error(`[AdminContent] ${msg}`, err || ''),
};

type TabType =
  | 'content'
  | 'popup'
  | 'testimonial'
  | 'gallery'
  | 'marquee'
  | 'podcast';

/**
 * SectionItemRow - 單一網站文案欄位的可摺疊卡片列
 *
 * 單一職責：負責單列的顯示/啟用/編輯/刪除互動。
 */
interface SectionItemRowProps {
  item: SiteContent;
  onToggle: (item: SiteContent) => void;
  onEdit: (item: SiteContent) => void;
  onDelete: (item: SiteContent) => void;
}
const SectionItemRow: React.FC<SectionItemRowProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  return (
    <div
      data-tour="content-item-row"
      className={`bg-luxe-surface rounded-lg border p-4 transition-all ${
        item.is_active ? 'border-luxe-gold/10' : 'border-luxe-gold/5 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-luxe-text font-medium text-sm">
              {item.content_name}
            </h3>
            <span className="text-xs px-1.5 py-0.5 bg-luxe-gold/10 text-luxe-gold/60 rounded">
              {item.content_type}
            </span>
            {!item.is_active && (
              <span className="text-xs px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded">
                {t.adminContentPage.status.inactive}
              </span>
            )}
          </div>
          <p className="text-luxe-text/70 text-xs line-clamp-2 whitespace-pre-wrap">
            {item.content_value || t.adminContentPage.fallback.noValue}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Toggle
            theme="luxe"
            checked={item.is_active}
            onChange={() => onToggle(item)}
          />
          <PillButton
            theme="luxe"
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
          >
            {t.common.edit}
          </PillButton>
          <button
            onClick={() => onDelete(item)}
            className="text-red-400 hover:text-red-300 text-sm px-1"
          >
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * TemplatePicker - 預設範本選擇器元件
 * 供管理員在新增/編輯內容時快速套用範本
 */
const TemplatePicker: React.FC<{
  contentKey: string;
  onSelect: (value: string) => void;
}> = ({ contentKey, onSelect }) => {
  const { t } = useLanguage();
  const templates: ContentTemplate[] = getTemplates(contentKey);

  if (templates.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm text-luxe-muted">
        {t.adminContentPage.form.templatePicker}
      </label>
      <div className="flex flex-wrap gap-2">
        {templates.map((tpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(tpl.value)}
            className="group relative px-3 py-1.5 text-xs rounded-lg border border-luxe-gold/20 text-luxe-text/70 hover:border-luxe-gold/50 hover:text-luxe-gold hover:bg-luxe-gold/5 transition-all"
            title={tpl.value}
          >
            {tpl.name}
            {/* Tooltip preview */}
            <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-luxe-surface border border-luxe-gold/30 rounded-lg text-xs text-luxe-text/80 whitespace-pre-wrap max-w-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg">
              {tpl.value.length > 100
                ? tpl.value.slice(0, 100) + '...'
                : tpl.value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * AdminContent - 內容管理頁面
 * 包含兩個分頁：網站文案 / 首頁彈窗
 */
const AdminContent: React.FC = () => {
  const dialog = useDialog();
  const { t, language } = useLanguage();
  const tp = t.adminContentPage;
  /** 日期顯示語系（跟著介面語言走） */
  const dateLocale = language === 'en' ? 'en-US' : 'zh-TW';

  // ===== 分頁狀態 =====
  const [activeTab, setActiveTab] = useState<TabType>('content');

  // ===== 網站文案狀態 =====
  const [sections, setSections] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSection, setEditingSection] = useState<SiteContent | null>(
    null
  );
  const [editContent, setEditContent] = useState('');
  const [editUrlError, setEditUrlError] = useState('');
  const [saving, setSaving] = useState(false);

  // ===== 新增文案狀態 =====
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContentForm, setNewContentForm] = useState({
    contentKey: '',
    contentName: '',
    contentValue: '',
    contentType: 'text' as 'text' | 'html' | 'json' | 'image',
  });

  // ===== 彈窗管理狀態 =====
  const [popups, setPopups] = useState<SitePopup[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState<SitePopup | null>(null);
  const [popupForm, setPopupForm] = useState({
    popupTitle: '',
    popupContent: '',
    showOnce: true,
    startDate: '',
    endDate: '',
  });

  // ===== 學員見證幻燈片狀態 =====
  const [testimonials, setTestimonials] = useState<TestimonialSlide[]>([]);
  const [testimonialConfig, setTestimonialConfig] = useState<TestimonialConfig>(
    { interval_ms: 4000, is_published: true, card_layout: 'portrait' }
  );
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<TestimonialSlide | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    imageUrl: '',
    name: '',
    achievement: '',
    quote: '',
  });
  const [testimonialUrlError, setTestimonialUrlError] = useState('');
  const [showTestimonialPreview, setShowTestimonialPreview] = useState(false);
  const [testimonialIntervalInput, setTestimonialIntervalInput] =
    useState('4000');

  // ===== 相片輪播狀態 =====
  const [gallerySlides, setGallerySlides] = useState<GallerySlide[]>([]);
  const [galleryConfig, setGalleryConfig] = useState<GalleryConfig>({
    is_published: true,
  });
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GallerySlide | null>(
    null
  );
  const [galleryForm, setGalleryForm] = useState({ imageUrl: '', caption: '' });
  const [galleryUrlError, setGalleryUrlError] = useState('');
  const [showGalleryPreview, setShowGalleryPreview] = useState(false);

  // ===== 認證 / 成果 Marquee 狀態 =====
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([]);
  const [marqueeLoading, setMarqueeLoading] = useState(false);
  const [showMarqueeModal, setShowMarqueeModal] = useState(false);
  const [editingMarquee, setEditingMarquee] = useState<MarqueeItem | null>(null);
  const [marqueeForm, setMarqueeForm] = useState<{
    type: MarqueeType;
    icon: string;
    label: string;
    sub: string;
  }>({ type: 'cert', icon: '🏅', label: '', sub: '' });

  // ===== Podcast 單集狀態 =====
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [showPodcastModal, setShowPodcastModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<PodcastEpisode | null>(
    null
  );
  const [podcastForm, setPodcastForm] = useState<{
    title: string;
    description: string;
    fullDescription: string;
    duration: string;
    episodeDate: string;
    category: EpisodeCategory;
  }>({
    title: '',
    description: '',
    fullDescription: '',
    duration: '',
    episodeDate: '',
    category: 'training',
  });

  // ===== 載入網站文案 =====
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await contentService.getAllAdmin();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('載入網站內容失敗', err);
      setError(t.adminContentPage.error.loadContentFailed);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ===== 載入彈窗 =====
  const fetchPopups = useCallback(async () => {
    try {
      setPopupLoading(true);
      const data = await contentService.getAllPopups();
      setPopups(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('載入彈窗失敗', err);
    } finally {
      setPopupLoading(false);
    }
  }, []);

  // ===== 載入學員見證 =====
  const fetchTestimonials = useCallback(async () => {
    try {
      setTestimonialLoading(true);
      const [slides, cfg] = await Promise.all([
        slidesService.getAdminTestimonials(),
        slidesService.getAdminTestimonialsConfig(),
      ]);
      setTestimonials(Array.isArray(slides) ? slides : []);
      setTestimonialConfig(cfg);
      setTestimonialIntervalInput(String(cfg.interval_ms));
    } catch (err) {
      logger.error('載入學員見證失敗', err);
    } finally {
      setTestimonialLoading(false);
    }
  }, []);

  // ===== 載入相片輪播 =====
  const fetchGallery = useCallback(async () => {
    try {
      setGalleryLoading(true);
      const [slides, cfg] = await Promise.all([
        slidesService.getAdminGallery(),
        slidesService.getAdminGalleryConfig(),
      ]);
      setGallerySlides(Array.isArray(slides) ? slides : []);
      setGalleryConfig(cfg);
    } catch (err) {
      logger.error('載入相片輪播失敗', err);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  // ===== 載入 Marquee =====
  const fetchMarquee = useCallback(async () => {
    try {
      setMarqueeLoading(true);
      const data = await marqueeService.getAdminAll();
      setMarqueeItems(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('載入 Marquee 失敗', err);
    } finally {
      setMarqueeLoading(false);
    }
  }, []);

  // ===== 載入 Podcast =====
  const fetchPodcast = useCallback(async () => {
    try {
      setPodcastLoading(true);
      const data = await podcastService.getAdminAll();
      setEpisodes(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('載入 Podcast 失敗', err);
    } finally {
      setPodcastLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    fetchPopups();
    fetchTestimonials();
    fetchGallery();
    fetchMarquee();
    fetchPodcast();
  }, [
    fetchContent,
    fetchPopups,
    fetchTestimonials,
    fetchGallery,
    fetchMarquee,
    fetchPodcast,
  ]);

  // ===== 文案操作 =====
  const handleEdit = (section: SiteContent) => {
    setEditingSection(section);
    setEditContent(section.content_value);
    setEditUrlError('');
    setError('');
  };

  const handleSaveContent = async () => {
    if (!editingSection) return;

    // image 型：只接受自家 Storage 上傳結果或 Cloudinary 網址
    if (editingSection.content_type === 'image') {
      if (!isAllowedImageUrl(editContent)) {
        setEditUrlError(tp.validation.imageUrlInvalid);
        return;
      }
    }
    // json 型：驗證格式
    if (editingSection.content_type === 'json' && editContent.trim() !== '') {
      try {
        JSON.parse(editContent);
      } catch {
        setError(tp.validation.invalidJsonDetail);
        return;
      }
    }

    try {
      setSaving(true);
      await contentService.updateContent(editingSection.content_id, {
        contentValue: editContent,
      });
      logger.info('網站內容已更新', { key: editingSection.content_key });
      setEditingSection(null);
      fetchContent();
    } catch (err) {
      logger.error('更新內容失敗', err);
      setError(tp.error.updateContentFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateContent = async () => {
    if (!newContentForm.contentKey || !newContentForm.contentName) {
      setError(tp.validation.keyAndNameRequired);
      return;
    }
    // image 型：只接受自家 Storage 上傳結果或 Cloudinary 網址
    if (newContentForm.contentType === 'image') {
      if (!isAllowedImageUrl(newContentForm.contentValue)) {
        setError(tp.validation.imageUrlInvalid);
        return;
      }
    }
    // json 型：格式驗證
    if (
      newContentForm.contentType === 'json' &&
      newContentForm.contentValue.trim() !== ''
    ) {
      try {
        JSON.parse(newContentForm.contentValue);
      } catch {
        setError(tp.validation.invalidJson);
        return;
      }
    }
    try {
      setSaving(true);
      await contentService.createContent({
        contentKey: newContentForm.contentKey,
        contentName: newContentForm.contentName,
        contentValue: newContentForm.contentValue,
        contentType: newContentForm.contentType,
        sortOrder: sections.length + 1,
      });
      logger.info('新增網站內容', { key: newContentForm.contentKey });
      setShowCreateModal(false);
      setNewContentForm({
        contentKey: '',
        contentName: '',
        contentValue: '',
        contentType: 'text',
      });
      fetchContent();
    } catch (err) {
      logger.error('新增內容失敗', err);
      setError(tp.error.createContentFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleContentActive = async (section: SiteContent) => {
    try {
      await contentService.updateContent(section.content_id, {
        isActive: !section.is_active,
      });
      fetchContent();
    } catch (err) {
      logger.error('切換顯示狀態失敗', err);
      setError(tp.error.toggleActiveFailed);
    }
  };

  const handleDeleteContent = async (section: SiteContent) => {
    const confirmed = await dialog.confirm({
      title: tp.confirm.deleteContentTitle,
      message: tp.confirm.deleteContentMessage.replace(
        '{name}',
        section.content_name
      ),
      variant: 'danger',
      confirmText: t.common.delete,
    });
    if (!confirmed) return;

    try {
      await contentService.deleteContent(section.content_id);
      logger.info('刪除網站內容', { key: section.content_key });
      fetchContent();
    } catch (err) {
      logger.error('刪除內容失敗', err);
      setError(tp.error.deleteContentFailed);
    }
  };

  // ===== 彈窗操作 =====
  const openPopupModal = (popup?: SitePopup) => {
    if (popup) {
      setEditingPopup(popup);
      setPopupForm({
        popupTitle: popup.popup_title,
        popupContent: popup.popup_content,
        showOnce: popup.show_once,
        startDate: popup.start_date
          ? new Date(popup.start_date).toISOString().slice(0, 16)
          : '',
        endDate: popup.end_date
          ? new Date(popup.end_date).toISOString().slice(0, 16)
          : '',
      });
    } else {
      setEditingPopup(null);
      setPopupForm({
        popupTitle: '',
        popupContent: '',
        showOnce: true,
        startDate: '',
        endDate: '',
      });
    }
    setShowPopupModal(true);
  };

  const handleSavePopup = async () => {
    if (!popupForm.popupTitle.trim()) {
      setError(tp.validation.popupTitleRequired);
      return;
    }
    try {
      setSaving(true);
      const payload = {
        popupTitle: popupForm.popupTitle,
        popupContent: popupForm.popupContent,
        showOnce: popupForm.showOnce,
        startDate: popupForm.startDate || null,
        endDate: popupForm.endDate || null,
      };

      if (editingPopup) {
        await contentService.updatePopup(editingPopup.popup_id, payload);
        logger.info('彈窗已更新', { id: editingPopup.popup_id });
      } else {
        await contentService.createPopup(payload);
        logger.info('新增彈窗成功');
      }

      setShowPopupModal(false);
      fetchPopups();
    } catch (err) {
      logger.error('儲存彈窗失敗', err);
      setError(tp.error.savePopupFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePopupActive = async (popup: SitePopup) => {
    try {
      const newActive = !popup.is_active;
      await contentService.updatePopup(popup.popup_id, {
        isActive: newActive,
      });
      logger.info('彈窗狀態切換', {
        id: popup.popup_id,
        active: newActive,
      });
      fetchPopups();
    } catch (err) {
      logger.error('切換彈窗狀態失敗', err);
      setError(tp.error.togglePopupFailed);
    }
  };

  const handleDeletePopup = async (popup: SitePopup) => {
    const confirmed = await dialog.confirm({
      title: tp.confirm.deletePopupTitle,
      message: tp.confirm.deleteMessage.replace(
        '{name}',
        popup.popup_title || tp.fallback.untitledPopup
      ),
      variant: 'danger',
      confirmText: t.common.delete,
    });
    if (!confirmed) return;

    try {
      await contentService.deletePopup(popup.popup_id);
      logger.info('刪除彈窗', { id: popup.popup_id });
      fetchPopups();
    } catch (err) {
      logger.error('刪除彈窗失敗', err);
      setError(tp.error.deletePopupFailed);
    }
  };

  // ===== 學員見證操作 =====
  const openTestimonialModal = (slide?: TestimonialSlide) => {
    if (slide) {
      setEditingTestimonial(slide);
      setTestimonialForm({
        imageUrl: slide.image_url,
        name: slide.name,
        achievement: slide.achievement,
        quote: slide.quote,
      });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({
        imageUrl: '',
        name: '',
        achievement: '',
        quote: '',
      });
    }
    setTestimonialUrlError('');
    setShowTestimonialModal(true);
  };

  const handleSaveTestimonial = async () => {
    if (!testimonialForm.imageUrl.trim()) {
      setTestimonialUrlError(tp.validation.testimonialPhotoRequired);
      return;
    }
    if (!isAllowedImageUrl(testimonialForm.imageUrl)) {
      setTestimonialUrlError(tp.validation.imageUrlInvalid);
      return;
    }
    try {
      setSaving(true);
      if (editingTestimonial) {
        await slidesService.updateTestimonial(editingTestimonial.id, {
          imageUrl: testimonialForm.imageUrl,
          name: testimonialForm.name,
          achievement: testimonialForm.achievement,
          quote: testimonialForm.quote,
        });
      } else {
        await slidesService.createTestimonial({
          imageUrl: testimonialForm.imageUrl,
          name: testimonialForm.name,
          achievement: testimonialForm.achievement,
          quote: testimonialForm.quote,
          sortOrder: testimonials.length + 1,
        });
      }
      setShowTestimonialModal(false);
      fetchTestimonials();
    } catch (err) {
      logger.error('儲存學員見證失敗', err);
      setError(tp.error.saveTestimonialFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTestimonialActive = async (slide: TestimonialSlide) => {
    try {
      await slidesService.updateTestimonial(slide.id, {
        isActive: !slide.is_active,
      });
      fetchTestimonials();
    } catch (err) {
      logger.error('切換狀態失敗', err);
    }
  };

  const handleDeleteTestimonial = async (slide: TestimonialSlide) => {
    const confirmed = await dialog.confirm({
      title: tp.confirm.deleteTestimonialTitle,
      message: tp.confirm.deleteMessage.replace(
        '{name}',
        slide.name || tp.fallback.thisTestimonial
      ),
      variant: 'danger',
      confirmText: t.common.delete,
    });
    if (!confirmed) return;
    try {
      await slidesService.deleteTestimonial(slide.id);
      fetchTestimonials();
    } catch (err) {
      logger.error('刪除學員見證失敗', err);
      setError(tp.error.deleteTestimonialFailed);
    }
  };

  const handleSaveTestimonialConfig = async () => {
    const ms = Number(testimonialIntervalInput);
    if (isNaN(ms) || ms < 1000 || ms > 30000) {
      setError(tp.validation.intervalRange);
      return;
    }
    try {
      setSaving(true);
      await slidesService.updateTestimonialsConfig({ intervalMs: ms });
      fetchTestimonials();
    } catch (err) {
      logger.error('更新輪播設定失敗', err);
      setError(tp.error.updateConfigFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTestimonialPublish = async () => {
    try {
      await slidesService.updateTestimonialsConfig({
        isPublished: !testimonialConfig.is_published,
      });
      fetchTestimonials();
    } catch (err) {
      logger.error('切換發布狀態失敗', err);
    }
  };

  const handleChangeTestimonialLayout = async (
    layout: TestimonialCardLayout
  ) => {
    if (layout === testimonialConfig.card_layout) return;
    try {
      await slidesService.updateTestimonialsConfig({ cardLayout: layout });
      fetchTestimonials();
    } catch (err) {
      logger.error('切換版型失敗', err);
    }
  };

  // ===== 相片輪播操作 =====
  const openGalleryModal = (slide?: GallerySlide) => {
    if (slide) {
      setEditingGallery(slide);
      setGalleryForm({ imageUrl: slide.image_url, caption: slide.caption });
    } else {
      setEditingGallery(null);
      setGalleryForm({ imageUrl: '', caption: '' });
    }
    setGalleryUrlError('');
    setShowGalleryModal(true);
  };

  const handleSaveGallery = async () => {
    if (!galleryForm.imageUrl.trim()) {
      setGalleryUrlError(tp.validation.galleryPhotoRequired);
      return;
    }
    if (!isAllowedImageUrl(galleryForm.imageUrl)) {
      setGalleryUrlError(tp.validation.imageUrlInvalid);
      return;
    }
    try {
      setSaving(true);
      if (editingGallery) {
        await slidesService.updateGallery(editingGallery.id, {
          imageUrl: galleryForm.imageUrl,
          caption: galleryForm.caption,
        });
      } else {
        await slidesService.createGallery({
          imageUrl: galleryForm.imageUrl,
          caption: galleryForm.caption,
          sortOrder: gallerySlides.length + 1,
        });
      }
      setShowGalleryModal(false);
      fetchGallery();
    } catch (err) {
      logger.error('儲存相片失敗', err);
      setError(tp.error.saveGalleryFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGalleryActive = async (slide: GallerySlide) => {
    try {
      await slidesService.updateGallery(slide.id, {
        isActive: !slide.is_active,
      });
      fetchGallery();
    } catch (err) {
      logger.error('切換狀態失敗', err);
    }
  };

  const handleDeleteGallery = async (slide: GallerySlide) => {
    const confirmed = await dialog.confirm({
      title: tp.confirm.deletePhotoTitle,
      message: tp.confirm.deleteMessage.replace(
        '{name}',
        slide.caption || tp.fallback.thisPhoto
      ),
      variant: 'danger',
      confirmText: t.common.delete,
    });
    if (!confirmed) return;
    try {
      await slidesService.deleteGallery(slide.id);
      fetchGallery();
    } catch (err) {
      logger.error('刪除相片失敗', err);
      setError(tp.error.deleteGalleryFailed);
    }
  };

  const handleToggleGalleryPublish = async () => {
    try {
      await slidesService.updateGalleryConfig({
        isPublished: !galleryConfig.is_published,
      });
      fetchGallery();
    } catch (err) {
      logger.error('切換發布狀態失敗', err);
    }
  };

  // ===== Marquee 操作 =====
  const openMarqueeModal = (item?: MarqueeItem, defaultType: MarqueeType = 'cert') => {
    if (item) {
      setEditingMarquee(item);
      setMarqueeForm({
        type: item.type,
        icon: item.icon,
        label: item.label,
        sub: item.sub,
      });
    } else {
      setEditingMarquee(null);
      setMarqueeForm({
        type: defaultType,
        icon: defaultType === 'cert' ? '🏅' : '',
        label: '',
        sub: '',
      });
    }
    setShowMarqueeModal(true);
  };

  const handleSaveMarquee = async () => {
    if (!marqueeForm.label.trim()) {
      setError(
        marqueeForm.type === 'cert'
          ? tp.validation.certNameRequired
          : tp.validation.statValueRequired
      );
      return;
    }
    try {
      setSaving(true);
      if (editingMarquee) {
        await marqueeService.update(editingMarquee.id, {
          type: marqueeForm.type,
          icon: marqueeForm.icon,
          label: marqueeForm.label,
          sub: marqueeForm.sub,
        });
      } else {
        const sameTypeCount = marqueeItems.filter(
          (it) => it.type === marqueeForm.type
        ).length;
        await marqueeService.create({
          type: marqueeForm.type,
          icon: marqueeForm.icon,
          label: marqueeForm.label,
          sub: marqueeForm.sub,
          sortOrder: sameTypeCount + 1,
        });
      }
      setShowMarqueeModal(false);
      fetchMarquee();
    } catch (err) {
      logger.error('儲存 Marquee 失敗', err);
      setError(tp.error.saveMarqueeFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMarqueeActive = async (item: MarqueeItem) => {
    try {
      await marqueeService.update(item.id, { isActive: !item.is_active });
      fetchMarquee();
    } catch (err) {
      logger.error('切換 Marquee 狀態失敗', err);
    }
  };

  const handleDeleteMarquee = async (item: MarqueeItem) => {
    const confirmed = await dialog.confirm({
      title: tp.confirm.deleteMarqueeTitle,
      message: tp.confirm.deleteMessage.replace('{name}', item.label),
      variant: 'danger',
      confirmText: t.common.delete,
    });
    if (!confirmed) return;
    try {
      await marqueeService.remove(item.id);
      fetchMarquee();
    } catch (err) {
      logger.error('刪除 Marquee 失敗', err);
      setError(t.adminCommon.deleteFailed);
    }
  };

  // ===== Podcast 操作 =====
  const openPodcastModal = (ep?: PodcastEpisode) => {
    if (ep) {
      setEditingEpisode(ep);
      setPodcastForm({
        title: ep.title,
        description: ep.description,
        fullDescription: ep.full_description,
        duration: ep.duration,
        episodeDate: ep.episode_date,
        category: ep.category,
      });
    } else {
      setEditingEpisode(null);
      setPodcastForm({
        title: '',
        description: '',
        fullDescription: '',
        duration: '',
        episodeDate: '',
        category: 'training',
      });
    }
    setShowPodcastModal(true);
  };

  const handleSavePodcast = async () => {
    if (!podcastForm.title.trim()) {
      setError(tp.validation.episodeTitleRequired);
      return;
    }
    try {
      setSaving(true);
      if (editingEpisode) {
        await podcastService.update(editingEpisode.id, {
          title: podcastForm.title,
          description: podcastForm.description,
          fullDescription: podcastForm.fullDescription,
          duration: podcastForm.duration,
          episodeDate: podcastForm.episodeDate,
          category: podcastForm.category,
        });
      } else {
        await podcastService.create({
          title: podcastForm.title,
          description: podcastForm.description,
          fullDescription: podcastForm.fullDescription,
          duration: podcastForm.duration,
          episodeDate: podcastForm.episodeDate,
          category: podcastForm.category,
          sortOrder: episodes.length + 1,
        });
      }
      setShowPodcastModal(false);
      fetchPodcast();
    } catch (err) {
      logger.error('儲存單集失敗', err);
      setError(tp.error.saveEpisodeFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePodcastActive = async (ep: PodcastEpisode) => {
    try {
      await podcastService.update(ep.id, { isActive: !ep.is_active });
      fetchPodcast();
    } catch (err) {
      logger.error('切換單集狀態失敗', err);
    }
  };

  const handleDeletePodcast = async (ep: PodcastEpisode) => {
    const confirmed = await dialog.confirm({
      title: tp.confirm.deleteEpisodeTitle,
      message: tp.confirm.deleteMessage.replace('{name}', ep.title),
      variant: 'danger',
      confirmText: t.common.delete,
    });
    if (!confirmed) return;
    try {
      await podcastService.remove(ep.id);
      fetchPodcast();
    } catch (err) {
      logger.error('刪除單集失敗', err);
      setError(tp.error.deleteEpisodeFailed);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            {tp.pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">
            {tp.pageSubtitle}
          </p>
        </div>
      </div>

      {/* Tab 切換 */}
      <div data-tour="content-tabs" className="flex flex-wrap gap-2 mb-6">
        <button
          data-tour="content-tab-content"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'content'
              ? 'bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30'
              : 'text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface'
          }`}
        >
          {tp.tabs.content}
        </button>
        <button
          onClick={() => setActiveTab('popup')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'popup'
              ? 'bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30'
              : 'text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface'
          }`}
        >
          {tp.tabs.popup}
        </button>
        <button
          data-tour="content-tab-testimonial"
          onClick={() => setActiveTab('testimonial')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'testimonial'
              ? 'bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30'
              : 'text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface'
          }`}
        >
          {tp.tabs.testimonial}
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'gallery'
              ? 'bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30'
              : 'text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface'
          }`}
        >
          {tp.tabs.gallery}
        </button>
        <button
          onClick={() => setActiveTab('marquee')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'marquee'
              ? 'bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30'
              : 'text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface'
          }`}
        >
          {tp.tabs.marquee}
        </button>
        <button
          onClick={() => setActiveTab('podcast')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'podcast'
              ? 'bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30'
              : 'text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface'
          }`}
        >
          {tp.tabs.podcast}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
          <button
            className="ml-2 text-red-300 hover:text-red-100"
            aria-label={tp.actions.dismissError}
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ===== 網站文案分頁 ===== */}
      {activeTab === 'content' && (
        <div>
          <div className="flex justify-end mb-4">
            <PillButton
              theme="luxe"
              variant="outline"
              data-tour="content-add-field"
              onClick={() => setShowCreateModal(true)}
            >
              {tp.actions.addField}
            </PillButton>
          </div>

          {loading ? (
            <div className="text-center py-12 text-luxe-muted">
              {t.common.loading}
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              {tp.empty.content}
            </div>
          ) : (
            <div className="space-y-8">
              {/* 依首頁區塊分組呈現 */}
              {HOMEPAGE_SECTIONS.map((sectionMeta) => {
                const sectionItems = sections.filter(
                  (s) => KEY_TO_SECTION_ID[s.content_key] === sectionMeta.id
                );
                // 區塊文案（標題／副標／說明／提示條）依 id 查字典
                const sectionText = t.homepageSections[sectionMeta.id];
                // 沒 item 也沒 hint → 跳過；只要有 hint 就保留一張卡片引導用戶
                if (sectionItems.length === 0 && !sectionText.hint) return null;
                return (
                  <div key={sectionMeta.id}>
                    {/* 區塊大標 */}
                    <div className="flex items-start gap-3 mb-3 pb-2 border-b border-luxe-gold/15">
                      <span className="text-2xl leading-none pt-0.5">
                        {sectionMeta.icon}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-luxe-text font-medium">
                          {sectionText.title}
                        </h2>
                        <p className="text-luxe-muted text-xs">
                          <span className="text-luxe-gold/70 mr-2">
                            {sectionText.tagline}
                          </span>
                          {sectionText.description}
                        </p>
                      </div>
                    </div>
                    {/* 區塊提示（共用資料 / 跳轉其他 tab） */}
                    {sectionText.hint && (
                      <div className="mb-3 p-2 text-xs text-luxe-gold/80 bg-luxe-gold/5 border border-luxe-gold/15 rounded flex items-center gap-2">
                        <span>{sectionText.hint}</span>
                        {sectionMeta.targetTab && (
                          <button
                            onClick={() => setActiveTab(sectionMeta.targetTab!)}
                            className="underline hover:text-luxe-gold whitespace-nowrap"
                          >
                            {tp.actions.goTo}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {sectionItems.map((item) => (
                        <SectionItemRow
                          key={item.content_id}
                          item={item}
                          onToggle={handleToggleContentActive}
                          onEdit={handleEdit}
                          onDelete={handleDeleteContent}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* 其他（未分類）*/}
              {(() => {
                const others = sections.filter(
                  (s) => !KEY_TO_SECTION_ID[s.content_key]
                );
                if (others.length === 0) return null;
                return (
                  <div>
                    <div className="flex items-start gap-3 mb-3 pb-2 border-b border-luxe-gold/15">
                      <span className="text-2xl leading-none pt-0.5">📦</span>
                      <div>
                        <h2 className="text-luxe-text font-medium">
                          {tp.sections.othersTitle}
                        </h2>
                        <p className="text-luxe-muted text-xs">
                          {tp.sections.othersDesc}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {others.map((item) => (
                        <SectionItemRow
                          key={item.content_id}
                          item={item}
                          onToggle={handleToggleContentActive}
                          onEdit={handleEdit}
                          onDelete={handleDeleteContent}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ===== 首頁彈窗分頁 ===== */}
      {activeTab === 'popup' && (
        <div>
          <div className="flex justify-end mb-4">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => openPopupModal()}
            >
              {tp.actions.addPopup}
            </PillButton>
          </div>

          {popupLoading ? (
            <div className="text-center py-12 text-luxe-muted">
              {t.common.loading}
            </div>
          ) : popups.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              {tp.empty.popups}
            </div>
          ) : (
            <div className="space-y-4">
              {popups.map((popup) => (
                <div
                  key={popup.popup_id}
                  className={`bg-luxe-surface rounded-lg border p-6 transition-all ${
                    popup.is_active
                      ? 'border-luxe-gold/40 shadow-md shadow-luxe-gold/10'
                      : 'border-luxe-gold/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-luxe-text font-medium">
                          {popup.popup_title || tp.fallback.untitledPopup}
                        </h3>
                        {popup.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded animate-pulse">
                            {tp.status.liveNow}
                          </span>
                        )}
                        {popup.show_once && (
                          <span className="text-xs px-2 py-0.5 bg-luxe-gold/10 text-luxe-gold/60 rounded">
                            {tp.status.showOnce}
                          </span>
                        )}
                      </div>
                      {(popup.start_date || popup.end_date) && (
                        <p className="text-luxe-muted text-xs mb-2">
                          ⏰{' '}
                          {popup.start_date
                            ? new Date(popup.start_date).toLocaleString(
                                dateLocale
                              )
                            : tp.status.immediately}
                          {' → '}
                          {popup.end_date
                            ? new Date(popup.end_date).toLocaleString(
                                dateLocale
                              )
                            : tp.status.forever}
                        </p>
                      )}
                      <div
                        className="text-luxe-text/60 text-sm line-clamp-2 [&>*]:m-0"
                        dangerouslySetInnerHTML={{
                          __html:
                            popup.popup_content.slice(0, 200) ||
                            tp.fallback.noContent,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Toggle
                        theme="luxe"
                        checked={popup.is_active}
                        onChange={() => handleTogglePopupActive(popup)}
                      />
                      <PillButton
                        theme="luxe"
                        variant="outline"
                        size="sm"
                        onClick={() => openPopupModal(popup)}
                      >
                        {t.common.edit}
                      </PillButton>
                      <button
                        onClick={() => handleDeletePopup(popup)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 學員見證幻燈片分頁 ===== */}
      {activeTab === 'testimonial' && (
        <div>
          {/* Config Bar */}
          <div
            data-tour="testimonial-config"
            className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-luxe-surface rounded-lg border border-luxe-gold/10"
          >
            {/* 發布狀態 */}
            <div className="flex items-center gap-3">
              <Toggle
                theme="luxe"
                checked={testimonialConfig.is_published}
                onChange={handleToggleTestimonialPublish}
              />
              <span className="text-sm text-luxe-text">
                {testimonialConfig.is_published
                  ? tp.status.visibleOnHome
                  : tp.status.hiddenDraft}
              </span>
            </div>

            {/* 版型切換 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-luxe-muted">{tp.layout.label}</span>
              <button
                onClick={() => handleChangeTestimonialLayout('portrait')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  testimonialConfig.card_layout === 'portrait'
                    ? 'bg-luxe-gold/20 border-luxe-gold/50 text-luxe-gold'
                    : 'border-luxe-gold/15 text-luxe-muted hover:border-luxe-gold/30 hover:text-luxe-text'
                }`}
              >
                <svg
                  className="w-3.5 h-4.5"
                  viewBox="0 0 10 14"
                  fill="currentColor"
                >
                  <rect
                    x="1"
                    y="1"
                    width="8"
                    height="12"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
                {tp.layout.portrait}
              </button>
              <button
                onClick={() => handleChangeTestimonialLayout('landscape')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  testimonialConfig.card_layout === 'landscape'
                    ? 'bg-luxe-gold/20 border-luxe-gold/50 text-luxe-gold'
                    : 'border-luxe-gold/15 text-luxe-muted hover:border-luxe-gold/30 hover:text-luxe-text'
                }`}
              >
                <svg
                  className="w-4.5 h-3.5"
                  viewBox="0 0 14 10"
                  fill="currentColor"
                >
                  <rect
                    x="1"
                    y="1"
                    width="12"
                    height="8"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
                {tp.layout.landscape}
              </button>
              <button
                onClick={() => handleChangeTestimonialLayout('quote-grid')}
                title={tp.layout.quoteGridTip}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  testimonialConfig.card_layout === 'quote-grid'
                    ? 'bg-luxe-gold/20 border-luxe-gold/50 text-luxe-gold'
                    : 'border-luxe-gold/15 text-luxe-muted hover:border-luxe-gold/30 hover:text-luxe-text'
                }`}
              >
                <svg
                  className="w-4.5 h-3.5"
                  viewBox="0 0 14 10"
                  fill="currentColor"
                >
                  <rect
                    x="1"
                    y="1"
                    width="3.3"
                    height="8"
                    rx="0.8"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <rect
                    x="5.35"
                    y="1"
                    width="3.3"
                    height="8"
                    rx="0.8"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <rect
                    x="9.7"
                    y="1"
                    width="3.3"
                    height="8"
                    rx="0.8"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </svg>
                {tp.layout.quoteGrid}
              </button>
            </div>

            {/* 輪播間隔 */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-luxe-muted">
                {tp.form.intervalMs}
              </label>
              <input
                type="number"
                min={1000}
                max={30000}
                step={500}
                value={testimonialIntervalInput}
                onChange={(e) => setTestimonialIntervalInput(e.target.value)}
                className="w-24 bg-luxe-surface border border-luxe-gold/20 rounded-lg px-3 py-1.5 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50"
              />
              <PillButton
                theme="luxe"
                variant="outline"
                size="sm"
                onClick={handleSaveTestimonialConfig}
                disabled={saving}
              >
                {tp.actions.apply}
              </PillButton>
            </div>

            <PillButton
              theme="luxe"
              variant="outline"
              size="sm"
              onClick={() => setShowTestimonialPreview(true)}
            >
              {tp.actions.previewEffect}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="outline"
              data-tour="testimonial-add"
              onClick={() => openTestimonialModal()}
            >
              {tp.actions.addSlide}
            </PillButton>
          </div>

          {testimonialLoading ? (
            <div className="text-center py-12 text-luxe-muted">
              {t.common.loading}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              {tp.empty.testimonials}
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map((slide) => (
                <div
                  key={slide.id}
                  className={`bg-luxe-surface rounded-lg border p-4 transition-all ${
                    slide.is_active
                      ? 'border-luxe-gold/15'
                      : 'border-luxe-gold/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      <img
                        src={slide.image_url}
                        alt={slide.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-luxe-text font-medium text-sm">
                          {slide.name || tp.fallback.unnamed}
                        </span>
                        {slide.achievement && (
                          <span className="text-xs bg-luxe-gold/10 text-luxe-gold px-2 py-0.5 rounded-full">
                            {slide.achievement}
                          </span>
                        )}
                        {!slide.is_active && (
                          <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">
                            {t.adminCommon.disabled}
                          </span>
                        )}
                      </div>
                      {slide.quote && (
                        <p className="text-luxe-muted text-xs line-clamp-1">
                          {tp.quoteWrap.replace('{text}', slide.quote)}
                        </p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Toggle
                        theme="luxe"
                        checked={slide.is_active}
                        onChange={() => handleToggleTestimonialActive(slide)}
                      />
                      <PillButton
                        theme="luxe"
                        variant="outline"
                        size="sm"
                        onClick={() => openTestimonialModal(slide)}
                      >
                        {t.common.edit}
                      </PillButton>
                      <button
                        onClick={() => handleDeleteTestimonial(slide)}
                        className="text-red-400 hover:text-red-300 text-sm px-1"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 相片輪播分頁 ===== */}
      {activeTab === 'gallery' && (
        <div>
          {/* Config Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-luxe-surface rounded-lg border border-luxe-gold/10">
            <div className="flex items-center gap-3">
              <Toggle
                theme="luxe"
                checked={galleryConfig.is_published}
                onChange={handleToggleGalleryPublish}
              />
              <span className="text-sm text-luxe-text">
                {galleryConfig.is_published
                  ? tp.status.visibleOnHome
                  : tp.status.hiddenDraft}
              </span>
            </div>
            <div className="flex gap-2 ml-auto">
              <PillButton
                theme="luxe"
                variant="outline"
                size="sm"
                onClick={() => setShowGalleryPreview(true)}
              >
                {tp.actions.previewEffect}
              </PillButton>
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => openGalleryModal()}
              >
                {tp.actions.addPhoto}
              </PillButton>
            </div>
          </div>

          {galleryLoading ? (
            <div className="text-center py-12 text-luxe-muted">
              {t.common.loading}
            </div>
          ) : gallerySlides.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              {tp.empty.gallery}
            </div>
          ) : (
            <div className="space-y-3">
              {gallerySlides.map((slide) => (
                <div
                  key={slide.id}
                  className={`bg-luxe-surface rounded-lg border p-4 transition-all ${
                    slide.is_active
                      ? 'border-luxe-gold/15'
                      : 'border-luxe-gold/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      <img
                        src={slide.image_url}
                        alt={slide.caption}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-luxe-text text-sm">
                        {slide.caption || tp.fallback.noCaption}
                      </p>
                      {!slide.is_active && (
                        <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded mt-1 inline-block">
                          {t.adminCommon.disabled}
                        </span>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Toggle
                        theme="luxe"
                        checked={slide.is_active}
                        onChange={() => handleToggleGalleryActive(slide)}
                      />
                      <PillButton
                        theme="luxe"
                        variant="outline"
                        size="sm"
                        onClick={() => openGalleryModal(slide)}
                      >
                        {t.common.edit}
                      </PillButton>
                      <button
                        onClick={() => handleDeleteGallery(slide)}
                        className="text-red-400 hover:text-red-300 text-sm px-1"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 認證 / 成果 Marquee 分頁 ===== */}
      {activeTab === 'marquee' && (
        <div>
          <div className="p-3 mb-4 bg-luxe-gold/5 border border-luxe-gold/20 rounded-lg text-xs text-luxe-muted">
            {tp.sections.marqueeIntroLead}
            <span className="text-luxe-gold mx-1">
              {tp.sections.marqueeTermCert}
            </span>
            {tp.sections.marqueeIntroJoin}
            <span className="text-luxe-gold mx-1">
              {tp.sections.marqueeTermStat}
            </span>
            {tp.sections.marqueeIntroTail}
          </div>

          {/* 認證標章 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-luxe-gold/15">
              <div>
                <h2 className="text-luxe-text font-medium">
                  {tp.sections.certsTitle}
                </h2>
                <p className="text-luxe-muted text-xs">
                  {tp.sections.certsDesc}
                </p>
              </div>
              <PillButton
                theme="luxe"
                variant="outline"
                size="sm"
                onClick={() => openMarqueeModal(undefined, 'cert')}
              >
                {tp.actions.addCert}
              </PillButton>
            </div>
            {marqueeLoading ? (
              <div className="text-center py-8 text-luxe-muted">
                {t.common.loading}
              </div>
            ) : (
              <div className="space-y-2">
                {marqueeItems
                  .filter((it) => it.type === 'cert')
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`bg-luxe-surface rounded-lg border p-4 transition-all ${
                        item.is_active
                          ? 'border-luxe-gold/15'
                          : 'border-luxe-gold/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl shrink-0">
                          {item.icon || '🏅'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-luxe-gold text-sm font-medium">
                            {item.label}
                          </p>
                          <p className="text-luxe-muted text-xs">
                            {item.sub || tp.fallback.noSubtext}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Toggle
                            theme="luxe"
                            checked={item.is_active}
                            onChange={() => handleToggleMarqueeActive(item)}
                          />
                          <PillButton
                            theme="luxe"
                            variant="outline"
                            size="sm"
                            onClick={() => openMarqueeModal(item)}
                          >
                            {t.common.edit}
                          </PillButton>
                          <button
                            onClick={() => handleDeleteMarquee(item)}
                            className="text-red-400 hover:text-red-300 text-sm px-1"
                          >
                            {t.common.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {marqueeItems.filter((it) => it.type === 'cert').length ===
                  0 && (
                  <div className="text-center py-8 text-luxe-muted">
                    {tp.empty.certs}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 成果數字 */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-luxe-gold/15">
              <div>
                <h2 className="text-luxe-text font-medium">
                  {tp.sections.statsTitle}
                </h2>
                <p className="text-luxe-muted text-xs">
                  {tp.sections.statsDesc}
                </p>
              </div>
              <PillButton
                theme="luxe"
                variant="outline"
                size="sm"
                onClick={() => openMarqueeModal(undefined, 'stat')}
              >
                {tp.actions.addStat}
              </PillButton>
            </div>
            {marqueeLoading ? (
              <div className="text-center py-8 text-luxe-muted">
                {t.common.loading}
              </div>
            ) : (
              <div className="space-y-2">
                {marqueeItems
                  .filter((it) => it.type === 'stat')
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`bg-luxe-surface rounded-lg border p-4 transition-all ${
                        item.is_active
                          ? 'border-luxe-gold/15'
                          : 'border-luxe-gold/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-luxe-gold tabular-nums min-w-[80px]">
                          {item.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-luxe-text text-sm">
                            {item.sub || tp.fallback.noDescription}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Toggle
                            theme="luxe"
                            checked={item.is_active}
                            onChange={() => handleToggleMarqueeActive(item)}
                          />
                          <PillButton
                            theme="luxe"
                            variant="outline"
                            size="sm"
                            onClick={() => openMarqueeModal(item)}
                          >
                            {t.common.edit}
                          </PillButton>
                          <button
                            onClick={() => handleDeleteMarquee(item)}
                            className="text-red-400 hover:text-red-300 text-sm px-1"
                          >
                            {t.common.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {marqueeItems.filter((it) => it.type === 'stat').length ===
                  0 && (
                  <div className="text-center py-8 text-luxe-muted">
                    {tp.empty.stats}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Podcast 單集分頁 ===== */}
      {activeTab === 'podcast' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-luxe-gold/5 border border-luxe-gold/20 rounded-lg text-xs text-luxe-muted flex-1 mr-4">
              {tp.sections.podcastIntro}
            </div>
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => openPodcastModal()}
            >
              {tp.actions.addEpisode}
            </PillButton>
          </div>

          {podcastLoading ? (
            <div className="text-center py-12 text-luxe-muted">
              {t.common.loading}
            </div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              {tp.empty.episodes}
            </div>
          ) : (
            <div className="space-y-3">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className={`bg-luxe-surface rounded-lg border p-4 transition-all ${
                    ep.is_active
                      ? 'border-luxe-gold/15'
                      : 'border-luxe-gold/5 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-luxe-text font-medium text-sm">
                          {ep.title || tp.fallback.unnamed}
                        </h3>
                        <span className="text-xs px-2 py-0.5 bg-luxe-gold/10 text-luxe-gold/70 rounded-full">
                          {tp.podcastCategory[ep.category] || ep.category}
                        </span>
                        {ep.duration && (
                          <span className="text-xs text-luxe-muted">
                            🎧 {ep.duration}
                          </span>
                        )}
                        {ep.episode_date && (
                          <span className="text-xs text-luxe-muted">
                            {ep.episode_date}
                          </span>
                        )}
                      </div>
                      {ep.description && (
                        <p className="text-luxe-muted text-xs line-clamp-2">
                          {ep.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Toggle
                        theme="luxe"
                        checked={ep.is_active}
                        onChange={() => handleTogglePodcastActive(ep)}
                      />
                      <PillButton
                        theme="luxe"
                        variant="outline"
                        size="sm"
                        onClick={() => openPodcastModal(ep)}
                      >
                        {t.common.edit}
                      </PillButton>
                      <button
                        onClick={() => handleDeletePodcast(ep)}
                        className="text-red-400 hover:text-red-300 text-sm px-1"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 編輯文案 Modal ===== */}
      <Modal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        title={tp.modal.editContent.replace(
          '{name}',
          editingSection?.content_name || ''
        )}
        theme="luxe"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={tp.form.keyReadonly}
            value={editingSection?.content_key || ''}
            disabled
            theme="luxe"
          />
          {/* 範本選擇器 */}
          {editingSection && (
            <TemplatePicker
              contentKey={editingSection.content_key}
              onSelect={(value) => {
                setEditContent(value);
                setEditUrlError('');
              }}
            />
          )}

          {/* 依 content_type 切換輸入 UI */}
          {editingSection &&
          STRING_ARRAY_KEYS.has(editingSection.content_key) ? (
            <div>
              <TagInput
                label={tp.form.listItems}
                theme="luxe"
                maxTags={20}
                tags={(() => {
                  if (!editContent.trim()) return [];
                  try {
                    const arr = JSON.parse(editContent);
                    return Array.isArray(arr)
                      ? arr.map((x) => String(x))
                      : [];
                  } catch {
                    return [];
                  }
                })()}
                onChange={(tags) =>
                  setEditContent(JSON.stringify(tags))
                }
                placeholder={tp.form.listItemsPlaceholder}
                hint={tp.form.listItemsHint}
              />
            </div>
          ) : editingSection?.content_type === 'image' ? (
            <ImageInput
              label={tp.form.image}
              value={editContent}
              onChange={(url) => {
                setEditContent(url);
                setEditUrlError('');
              }}
              entity="site-content"
              entityKey={`site_${editingSection.content_key}`}
              kind="photo"
              aspectHint="3 / 4"
              error={editUrlError}
            />
          ) : editingSection?.content_type === 'json' ? (
            <Textarea
              label={tp.form.contentJson}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              theme="luxe"
              rows={8}
              placeholder={tp.form.contentJsonPlaceholder}
            />
          ) : (
            <Textarea
              label={tp.form.content}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              theme="luxe"
              rows={8}
            />
          )}
          <div className="flex justify-end gap-3">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setEditingSection(null)}
            >
              {t.common.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSaveContent}
              disabled={saving}
            >
              {saving ? t.adminCommon.saving : t.common.save}
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* ===== 新增文案 Modal ===== */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={tp.modal.createContent}
        theme="luxe"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={tp.form.contentKey}
            value={newContentForm.contentKey}
            onChange={(e) =>
              setNewContentForm({
                ...newContentForm,
                contentKey: e.target.value.replace(/\s/g, '_').toLowerCase(),
              })
            }
            placeholder={tp.form.contentKeyPlaceholder}
            theme="luxe"
          />
          <Input
            label={tp.form.displayName}
            value={newContentForm.contentName}
            onChange={(e) =>
              setNewContentForm({
                ...newContentForm,
                contentName: e.target.value,
              })
            }
            placeholder={tp.form.displayNamePlaceholder}
            theme="luxe"
          />
          <div>
            <label className="block text-sm text-luxe-muted mb-1">
              {tp.form.contentTypeLabel}
            </label>
            <select
              value={newContentForm.contentType}
              onChange={(e) =>
                setNewContentForm({
                  ...newContentForm,
                  contentType: e.target.value as
                    | 'text'
                    | 'html'
                    | 'json'
                    | 'image',
                })
              }
              className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
            >
              <option value="text">{tp.contentType.text}</option>
              <option value="html">{tp.contentType.html}</option>
              <option value="json">{tp.contentType.json}</option>
              <option value="image">{tp.contentType.image}</option>
            </select>
          </div>
          {/* 範本選擇器 - 根據輸入的 Key 動態顯示 */}
          {newContentForm.contentKey && (
            <TemplatePicker
              contentKey={newContentForm.contentKey}
              onSelect={(value) =>
                setNewContentForm({ ...newContentForm, contentValue: value })
              }
            />
          )}
          {newContentForm.contentType === 'image' ? (
            <ImageInput
              label={tp.form.initialImage}
              value={newContentForm.contentValue}
              onChange={(url) =>
                setNewContentForm({ ...newContentForm, contentValue: url })
              }
              entity="site-content"
              entityKey={
                newContentForm.contentKey
                  ? `site_${newContentForm.contentKey}`
                  : null
              }
              kind="photo"
              aspectHint="3 / 4"
            />
          ) : (
            <Textarea
              label={tp.form.initialContent}
              value={newContentForm.contentValue}
              onChange={(e) =>
                setNewContentForm({
                  ...newContentForm,
                  contentValue: e.target.value,
                })
              }
              theme="luxe"
              rows={4}
            />
          )}
          <div className="flex justify-end gap-3">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              {t.common.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleCreateContent}
              disabled={saving}
            >
              {saving ? tp.actions.creating : t.common.create}
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* ===== 彈窗編輯 Modal ===== */}
      <Modal
        isOpen={showPopupModal}
        onClose={() => setShowPopupModal(false)}
        title={editingPopup ? tp.modal.editPopup : tp.modal.createPopup}
        theme="luxe"
        size="full"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label={tp.form.popupTitle}
            value={popupForm.popupTitle}
            onChange={(e) =>
              setPopupForm({ ...popupForm, popupTitle: e.target.value })
            }
            placeholder={tp.form.popupTitlePlaceholder}
            theme="luxe"
          />

          <div>
            <label className="block text-sm text-luxe-muted mb-2">
              {tp.form.popupContent}
            </label>
            {/* 彈窗內文插圖：放進 content-images 的 site_popup_* 前綴 */}
            <ImageUploadTargetProvider
              value={{
                entity: 'site-content',
                entityKey: editingPopup
                  ? `site_popup_${editingPopup.popup_id}`
                  : null,
              }}
            >
              <RichTextEditor
                content={popupForm.popupContent}
                onChange={(html) =>
                  setPopupForm({ ...popupForm, popupContent: html })
                }
                theme="luxe"
              />
            </ImageUploadTargetProvider>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-luxe-muted mb-1">
                {tp.form.startDate}
              </label>
              <input
                type="datetime-local"
                value={popupForm.startDate}
                onChange={(e) =>
                  setPopupForm({ ...popupForm, startDate: e.target.value })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm text-luxe-muted mb-1">
                {tp.form.endDate}
              </label>
              <input
                type="datetime-local"
                value={popupForm.endDate}
                onChange={(e) =>
                  setPopupForm({ ...popupForm, endDate: e.target.value })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Toggle
              theme="luxe"
              checked={popupForm.showOnce}
              onChange={(checked) =>
                setPopupForm({ ...popupForm, showOnce: checked })
              }
            />
            <span className="text-sm text-luxe-text">
              {tp.form.showOnce}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-luxe-gold/10">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowPopupModal(false)}
            >
              {t.common.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSavePopup}
              disabled={saving}
            >
              {saving ? t.adminCommon.saving : t.common.save}
            </PillButton>
          </div>
        </div>
      </Modal>
      {/* ===== 學員見證 新增/編輯 Modal ===== */}
      <Modal
        isOpen={showTestimonialModal}
        onClose={() => setShowTestimonialModal(false)}
        title={
          editingTestimonial
            ? tp.modal.editTestimonial
            : tp.modal.createTestimonial
        }
        theme="luxe"
        size="lg"
        tourId="testimonial-form"
      >
        <div className="space-y-4">
          <ImageInput
            label={tp.form.studentPhoto}
            value={testimonialForm.imageUrl}
            onChange={(url) => {
              setTestimonialForm({ ...testimonialForm, imageUrl: url });
              setTestimonialUrlError('');
            }}
            entity="testimonial"
            entityKey={editingTestimonial?.id ?? null}
            kind="photo"
            aspectHint="3 / 4"
            required
            error={testimonialUrlError}
          />
          <Input
            label={tp.form.studentName}
            value={testimonialForm.name}
            onChange={(e) =>
              setTestimonialForm({ ...testimonialForm, name: e.target.value })
            }
            placeholder={tp.form.studentNamePlaceholder}
            theme="luxe"
          />
          <Input
            label={tp.form.achievement}
            value={testimonialForm.achievement}
            onChange={(e) =>
              setTestimonialForm({
                ...testimonialForm,
                achievement: e.target.value,
              })
            }
            placeholder={tp.form.achievementPlaceholder}
            theme="luxe"
          />
          <Textarea
            label={tp.form.quote}
            value={testimonialForm.quote}
            onChange={(e) =>
              setTestimonialForm({ ...testimonialForm, quote: e.target.value })
            }
            placeholder={tp.form.quotePlaceholder}
            theme="luxe"
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowTestimonialModal(false)}
            >
              {t.common.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              data-tour="testimonial-form-submit"
              onClick={handleSaveTestimonial}
              disabled={saving}
            >
              {saving ? t.adminCommon.saving : t.common.save}
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* ===== 學員見證 預覽 Modal ===== */}
      <Modal
        isOpen={showTestimonialPreview}
        onClose={() => setShowTestimonialPreview(false)}
        title={tp.modal.previewTestimonials}
        theme="luxe"
        size="full"
      >
        <div className="overflow-y-auto max-h-[75vh] bg-luxe-bg rounded-xl">
          <TestimonialCarousel
            preview={true}
            initialSlides={testimonials.filter((s) => s.is_active)}
            initialConfig={testimonialConfig}
          />
        </div>
      </Modal>

      {/* ===== 相片輪播 新增/編輯 Modal ===== */}
      <Modal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        title={editingGallery ? tp.modal.editPhoto : tp.modal.createPhoto}
        theme="luxe"
        size="lg"
      >
        <div className="space-y-4">
          <ImageInput
            label={tp.form.photo}
            value={galleryForm.imageUrl}
            onChange={(url) => {
              setGalleryForm({ ...galleryForm, imageUrl: url });
              setGalleryUrlError('');
            }}
            entity="gallery"
            entityKey={editingGallery ? `gallery_${editingGallery.id}` : null}
            kind="photo"
            aspectHint="16 / 10"
            required
            error={galleryUrlError}
          />
          <Input
            label={tp.form.caption}
            value={galleryForm.caption}
            onChange={(e) =>
              setGalleryForm({ ...galleryForm, caption: e.target.value })
            }
            placeholder={tp.form.captionPlaceholder}
            theme="luxe"
          />
          <div className="flex justify-end gap-3 pt-2">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowGalleryModal(false)}
            >
              {t.common.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSaveGallery}
              disabled={saving}
            >
              {saving ? t.adminCommon.saving : t.common.save}
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* ===== 相片輪播 預覽 Modal ===== */}
      <Modal
        isOpen={showGalleryPreview}
        onClose={() => setShowGalleryPreview(false)}
        title={tp.modal.previewGallery}
        theme="luxe"
        size="full"
      >
        <div className="overflow-y-auto max-h-[75vh] bg-luxe-bg rounded-xl">
          <GallerySlider
            preview={true}
            initialSlides={gallerySlides.filter((s) => s.is_active)}
            initialConfig={galleryConfig}
          />
        </div>
      </Modal>

      {/* ===== Marquee 新增 / 編輯 Modal ===== */}
      <Modal
        isOpen={showMarqueeModal}
        onClose={() => setShowMarqueeModal(false)}
        title={
          editingMarquee
            ? marqueeForm.type === 'cert'
              ? tp.modal.editCert
              : tp.modal.editStat
            : marqueeForm.type === 'cert'
              ? tp.modal.createCert
              : tp.modal.createStat
        }
        theme="luxe"
        size="lg"
      >
        <div className="space-y-4">
          {marqueeForm.type === 'cert' ? (
            <>
              <Input
                label={tp.form.emojiIcon}
                value={marqueeForm.icon}
                onChange={(e) =>
                  setMarqueeForm({ ...marqueeForm, icon: e.target.value })
                }
                placeholder="🏅"
                theme="luxe"
              />
              <Input
                label={tp.form.certName}
                value={marqueeForm.label}
                onChange={(e) =>
                  setMarqueeForm({ ...marqueeForm, label: e.target.value })
                }
                placeholder={tp.form.certNamePlaceholder}
                theme="luxe"
              />
              <Input
                label={tp.form.certSub}
                value={marqueeForm.sub}
                onChange={(e) =>
                  setMarqueeForm({ ...marqueeForm, sub: e.target.value })
                }
                placeholder={tp.form.certSubPlaceholder}
                theme="luxe"
              />
            </>
          ) : (
            <>
              <Input
                label={tp.form.statValue}
                value={marqueeForm.label}
                onChange={(e) =>
                  setMarqueeForm({ ...marqueeForm, label: e.target.value })
                }
                placeholder={tp.form.statValuePlaceholder}
                theme="luxe"
              />
              <Input
                label={tp.form.statSub}
                value={marqueeForm.sub}
                onChange={(e) =>
                  setMarqueeForm({ ...marqueeForm, sub: e.target.value })
                }
                placeholder={tp.form.statSubPlaceholder}
                theme="luxe"
              />
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowMarqueeModal(false)}
            >
              {t.common.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSaveMarquee}
              disabled={saving}
            >
              {saving ? t.adminCommon.saving : t.common.save}
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* ===== Podcast 單集 新增 / 編輯 Modal ===== */}
      <Modal
        isOpen={showPodcastModal}
        onClose={() => setShowPodcastModal(false)}
        title={editingEpisode ? tp.modal.editEpisode : tp.modal.createEpisode}
        theme="luxe"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label={tp.form.episodeTitle}
            value={podcastForm.title}
            onChange={(e) =>
              setPodcastForm({ ...podcastForm, title: e.target.value })
            }
            placeholder={tp.form.episodeTitlePlaceholder}
            theme="luxe"
          />
          <Textarea
            label={tp.form.shortDescription}
            value={podcastForm.description}
            onChange={(e) =>
              setPodcastForm({
                ...podcastForm,
                description: e.target.value,
              })
            }
            placeholder={tp.form.shortDescriptionPlaceholder}
            theme="luxe"
            rows={2}
          />
          <Textarea
            label={tp.form.fullDescription}
            value={podcastForm.fullDescription}
            onChange={(e) =>
              setPodcastForm({
                ...podcastForm,
                fullDescription: e.target.value,
              })
            }
            placeholder={tp.form.fullDescriptionPlaceholder}
            theme="luxe"
            rows={5}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={tp.form.duration}
              value={podcastForm.duration}
              onChange={(e) =>
                setPodcastForm({ ...podcastForm, duration: e.target.value })
              }
              placeholder={tp.form.durationPlaceholder}
              theme="luxe"
            />
            <Input
              label={tp.form.publishDate}
              value={podcastForm.episodeDate}
              onChange={(e) =>
                setPodcastForm({
                  ...podcastForm,
                  episodeDate: e.target.value,
                })
              }
              placeholder={tp.form.publishDatePlaceholder}
              theme="luxe"
            />
            <div>
              <label className="block text-sm text-luxe-muted mb-1">
                {t.adminCommon.colCategory}
              </label>
              <select
                value={podcastForm.category}
                onChange={(e) =>
                  setPodcastForm({
                    ...podcastForm,
                    category: e.target.value as EpisodeCategory,
                  })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
              >
                {EPISODE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {tp.podcastCategory[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-luxe-gold/10">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowPodcastModal(false)}
            >
              {t.common.cancel}
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSavePodcast}
              disabled={saving}
            >
              {saving ? t.adminCommon.saving : t.common.save}
            </PillButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminContent;
