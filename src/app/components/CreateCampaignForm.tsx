'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

type DynamicQuestion = {
  id: number;
  type: 'checkbox' | 'radio' | 'text';
  question: string;
  options: string[];
};

type QuestionOption = {
  id: number;
  questionId: number;
  optionText: string;
  optionOrder: number;
};

type FixedQuestion = {
  id: number;
  questionText: string;
  questionType: 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  source: 'FIXED' | 'CUSTOM';
  isActive: boolean;
  options: QuestionOption[];
};

type Step1Errors = Partial<Record<
  | "brandId"
  | 'productName'
  | 'productImage'
  | 'productLink'
  | 'marketplace'
  | 'productDescription'
  | 'earning'
  | 'slots'
  | 'startDate'
  | 'endDate',
  string
>>;

type DynamicQuestionError = {
  question?: string;
  options?: string;
};

type LocationApiResponse = {
  success: boolean;
  count?: number;
  data?: string[];
  message?: string;
};

type CampaignFormMode =
  | "CREATE"
  | "EDIT";

type CampaignFormRole =
  | "BRAND"
  | "ADMIN";

type CreateCampaignFormProps = {
  mode?: CampaignFormMode;
  role?: CampaignFormRole;
};

type BrandOption = {
  id: number;
  companyName: string;
  companyType: string;
  category: string;
};

type BrandsApiResponse = {
  success: boolean;
  message?: string;

  data?: Array<{
    id: number;
    companyName: string;
    companyType: string;
    category: string;
  }>;
};

export default function CreateCampaignPage({
  mode = "CREATE",
  role = "BRAND",
}: CreateCampaignFormProps) {
  const router = useRouter();

  const [brands, setBrands] =
  useState<BrandOption[]>([]);

  const [selectedBrandId, setSelectedBrandId] =
    useState("");

  const [loadingBrands, setLoadingBrands] =
    useState(false);

  const [brandError, setBrandError] =
  useState("");


  const [currentStep, setCurrentStep] = useState(1);

  // Location State
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    productName: '',
    productImages: [] as File[],
    productLink: '',
    marketplace: '',
    productDescription: '',
    earning: '',
    slots: '',
    startDate: '',
    endDate: '',
    state: 'any',
    city: 'any',
    gender: 'ANY',
    task4Required: false,
  });

  const [marketplaceSelection, setMarketplaceSelection] =
    useState("");

  const [customMarketplace, setCustomMarketplace] =
    useState("");

  // Fixed & Dynamic Questions State
  const [fixedQuestions, setFixedQuestions] = useState<FixedQuestion[]>([]);
  const [selectedFixedQuestionIds, setSelectedFixedQuestionIds] = useState<number[]>([]);
  const [loadingFixedQuestions, setLoadingFixedQuestions] = useState(true);
  const [fixedQuestionsError, setFixedQuestionsError] = useState('');

  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent the same successfully-created campaign from being submitted again.
  const [campaignCreated, setCampaignCreated] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [resultModal, setResultModal] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  // Validation State
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Error, setStep2Error] = useState('');
  const [dynamicQuestionErrors, setDynamicQuestionErrors] = useState<Record<number, DynamicQuestionError>>({});
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);

  // ============================================================
  // PRODUCT DESCRIPTION RICH TEXT EDITOR
  // ============================================================
  const productDescriptionEditor = useEditor({
    extensions: [
      StarterKit,
    ],

    content: formData.productDescription,

    // Recommended for Tiptap in Next.js client components.
    immediatelyRender: false,

    editorProps: {
      attributes: {
        class: 'p-3',
        style:
          'min-height: 180px; outline: none; white-space: normal;',
      },
    },

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      setFormData((prev) => ({
        ...prev,
        productDescription: html,
      }));

      // Remove the validation error as soon as valid text is entered.
      if (editor.getText().trim()) {
        setStep1Errors((prev) => {
          const next = { ...prev };
          delete next.productDescription;
          return next;
        });
      }
    },
  });


  useEffect(() => {
  if (role !== "ADMIN") {
    return;
  }

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      setBrandError("");

      const response = await fetch(
        "/api/admin/brands?status=ACTIVE&limit=100",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as BrandsApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load Brands."
        );
      }

      const brandOptions =
        (result.data ?? []).map(
          (brand) => ({
            id: brand.id,
            companyName:
              brand.companyName,
            companyType:
              brand.companyType,
            category:
              brand.category,
          })
        );

      setBrands(brandOptions);
    } catch (error) {
      console.error(
        "LOAD BRANDS ERROR:",
        error
      );

      setBrands([]);

      setBrandError(
        error instanceof Error
          ? error.message
          : "Unable to load Brands."
      );
    } finally {
      setLoadingBrands(false);
    }
  };

  loadBrands();
}, [role]);

  useEffect(() => {
    const previewUrls = formData.productImages.map((image) => URL.createObjectURL(image));
    setProductImagePreviews(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.productImages]);

  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoadingStates(true);
        setLocationError('');

        const response = await fetch('/api/pincode-master/states', {
          method: 'GET',
          credentials: 'include',
        });

        const result: LocationApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load states.');
        }

        setStates(result.data ?? []);
      } catch (error) {
        console.error('Load states error:', error);
        setStates([]);
        setLocationError(
          error instanceof Error ? error.message : 'Failed to load states.'
        );
      } finally {
        setLoadingStates(false);
      }
    };

    loadStates();
  }, []);

  useEffect(() => {
    if (!formData.state || formData.state === 'any') {
      setCities([]);
      setFormData((prev) => ({ ...prev, city: 'any' }));
      return;
    }

    const controller = new AbortController();

    const loadCities = async () => {
      try {
        setLoadingCities(true);
        setLocationError('');

        const response = await fetch(
          `/api/pincode-master/cities?state=${encodeURIComponent(formData.state)}`,
          {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          }
        );

        const result: LocationApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load cities.');
        }

        setCities(result.data ?? []);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;

        console.error('Load cities error:', error);
        setCities([]);
        setLocationError(
          error instanceof Error ? error.message : 'Failed to load cities.'
        );
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();

    return () => {
      controller.abort();
    };
  }, [formData.state]);

  useEffect(() => {
    const loadFixedQuestions = async () => {
      try {
        setLoadingFixedQuestions(true);
        setFixedQuestionsError('');

        const response = await fetch('/api/questions?source=FIXED&isActive=true', {
          method: 'GET',
          credentials: 'include',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load fixed questions.');
        }

        setFixedQuestions(result.data ?? []);
      } catch (error) {
        setFixedQuestionsError(
          error instanceof Error ? error.message : 'Failed to load fixed questions.'
        );
      } finally {
        setLoadingFixedQuestions(false);
      }
    };

    loadFixedQuestions();
  }, []);

  // Handlers for Form Data
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      const checked = e.target.checked;
      setFormData((prev) => ({ ...prev, [id]: checked }));
      return;
    }

    // If State changes, immediately reset City so an old city from a
    // different state can never remain selected.
    if (id === 'state') {
      setFormData((prev) => ({
        ...prev,
        state: value,
        city: 'any',
      }));
      setCities([]);
      setLocationError('');
      return;
    }

    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear the field error as soon as the user starts correcting it.
    if (id in step1Errors) {
      setStep1Errors((prev) => {
        const next = { ...prev };
        delete next[id as keyof Step1Errors];
        return next;
      });
    }
  };

  const handleMarketplaceChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;

    setMarketplaceSelection(value);

    if (value === "Other") {
      setFormData((prev) => ({
        ...prev,
        marketplace: customMarketplace.trim(),
      }));
    } else {
      setCustomMarketplace("");

      setFormData((prev) => ({
        ...prev,
        marketplace: value,
      }));
    }

    setStep1Errors((prev) => {
      const next = { ...prev };
      delete next.marketplace;
      return next;
    });
  };

  const handleCustomMarketplaceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setCustomMarketplace(value);

    setFormData((prev) => ({
      ...prev,
      marketplace: value,
    }));

    setStep1Errors((prev) => {
      const next = { ...prev };
      delete next.marketplace;
      return next;
    });
  };

  const handleFixedQuestionToggle = (id: number) => {
    setSelectedFixedQuestionIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((questionId) => questionId !== id)
        : [...prev, id];

      if (next.length > 0) {
        setStep2Error('');
      }

      return next;
    });
  };

  // Dynamic Question Handlers
  const addQuestion = () => {
    if (dynamicQuestions.length >= 5) return;
    setDynamicQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'radio',
        question: '',
        options: ['', ''],
      },
    ]);
  };

  const removeQuestion = (id: number) => {
    setDynamicQuestions((prev) => prev.filter((q) => q.id !== id));
    setDynamicQuestionErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateQuestionTitle = (id: number, text: string) => {
    setDynamicQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: text } : q))
    );

    setDynamicQuestionErrors((prev) => ({
      ...prev,
      [id]: { ...prev[id], question: undefined },
    }));
  };

  const updateQuestionType = (id: number, type: 'checkbox' | 'radio' | 'text') => {
    setDynamicQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, type } : q))
    );

    setDynamicQuestionErrors((prev) => ({
      ...prev,
      [id]: { ...prev[id], options: undefined },
    }));
  };

  const addOption = (qId: number) => {
    setDynamicQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId && q.options.length < 4) {
          return { ...q, options: [...q.options, ''] };
        }
        return q;
      })
    );
  };

  const updateOptionText = (qId: number, optIndex: number, text: string) => {
    setDynamicQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const updatedOptions = [...q.options];
          updatedOptions[optIndex] = text;
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );

    setDynamicQuestionErrors((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], options: undefined },
    }));
  };

  const removeOption = (qId: number, optIndex: number) => {
    setDynamicQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          return { ...q, options: q.options.filter((_, idx) => idx !== optIndex) };
        }
        return q;
      })
    );
  };


  const handleProductImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    const invalidTypeImage = selectedFiles.find(
      (image) => !allowedTypes.includes(image.type)
    );
    if (invalidTypeImage) {
      setStep1Errors((prev) => ({
        ...prev,
        productImage: `${invalidTypeImage.name}: only JPG, PNG, or WEBP images are allowed.`,
      }));
      e.target.value = '';
      return;
    }

    const oversizedImage = selectedFiles.find((image) => image.size > maxSize);
    if (oversizedImage) {
      setStep1Errors((prev) => ({
        ...prev,
        productImage: `${oversizedImage.name}: each image must be 5 MB or smaller.`,
      }));
      e.target.value = '';
      return;
    }

    const mergedImages = [...formData.productImages];
    for (const image of selectedFiles) {
      const alreadySelected = mergedImages.some(
        (existing) =>
          existing.name === image.name &&
          existing.size === image.size &&
          existing.lastModified === image.lastModified
      );

      if (!alreadySelected) {
        mergedImages.push(image);
      }
    }

    if (mergedImages.length > 4) {
      setStep1Errors((prev) => ({
        ...prev,
        productImage: 'You can upload a maximum of 4 product images.',
      }));
      e.target.value = '';
      return;
    }

    setFormData((prev) => ({ ...prev, productImages: mergedImages }));
    setStep1Errors((prev) => {
      const next = { ...prev };
      delete next.productImage;
      return next;
    });

    // Clear the native input so the user can select more images later.
    e.target.value = '';
  };

  const removeProductImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, imageIndex) => imageIndex !== index),
    }));
  };


  // ------------------------------------------------------------
  // Step Validation
  // ------------------------------------------------------------
  const validateStep1 = () => {
    const errors: Step1Errors = {};

    if (!formData.productName.trim()) {
      errors.productName = 'Product name is required.';
    }

    if (formData.productImages.length === 0) {
      errors.productImage = 'At least one product image is required.';
    } else if (formData.productImages.length > 4) {
      errors.productImage = 'You can upload a maximum of 4 product images.';
    } else {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024;

      const invalidTypeImage = formData.productImages.find(
        (image) => !allowedTypes.includes(image.type)
      );
      const oversizedImage = formData.productImages.find(
        (image) => image.size > maxSize
      );

      if (invalidTypeImage) {
        errors.productImage = `${invalidTypeImage.name}: only JPG, PNG, or WEBP images are allowed.`;
      } else if (oversizedImage) {
        errors.productImage = `${oversizedImage.name}: each image must be 5 MB or smaller.`;
      }
    }

    if (!formData.productLink.trim()) {
      errors.productLink = 'Product link is required.';
    } else {
      try {
        const url = new URL(formData.productLink);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.productLink = 'Enter a valid http:// or https:// URL.';
        }
      } catch {
        errors.productLink = 'Enter a valid product URL.';
      }
    }

    if (!marketplaceSelection) {
      errors.marketplace = 'Marketplace is required.';
    } else if (
      marketplaceSelection === 'Other' &&
      !customMarketplace.trim()
    ) {
      errors.marketplace = 'Enter the marketplace name.';
    } else if (!formData.marketplace.trim()) {
      errors.marketplace = 'Marketplace is required.';
    } else if (formData.marketplace.trim().length > 100) {
      errors.marketplace = 'Marketplace name must be 100 characters or less.';
    }

    const productDescriptionText =
      formData.productDescription
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!productDescriptionText) {
      errors.productDescription = 'Product description is required.';
    }

    const earning = Number(formData.earning);
    if (!formData.earning.trim()) {
      errors.earning = 'Earning per tester is required.';
    } else if (!Number.isFinite(earning) || earning <= 0) {
      errors.earning = 'Earning must be greater than 0.';
    }

    const slots = Number(formData.slots);
    if (!formData.slots.trim()) {
      errors.slots = 'Total slots are required.';
    } else if (!Number.isInteger(slots) || slots <= 0) {
      errors.slots = 'Total slots must be a whole number greater than 0.';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required.';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required.';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(`${formData.startDate}T00:00:00`);
      const end = new Date(`${formData.endDate}T00:00:00`);

      if (end < start) {
        errors.endDate = 'End date cannot be before the start date.';
      }
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const validateStep2 = () => {
    let valid = true;
    let fixedError = '';
    const customErrors: Record<number, DynamicQuestionError> = {};

    if (loadingFixedQuestions) {
      fixedError = 'Please wait until the fixed questions finish loading.';
      valid = false;
    } else if (fixedQuestionsError) {
      fixedError = 'Fixed questions could not be loaded. Please retry before continuing.';
      valid = false;
    } else if (selectedFixedQuestionIds.length === 0) {
      fixedError = 'Select at least one fixed question before continuing.';
      valid = false;
    }

    dynamicQuestions.forEach((question) => {
      const error: DynamicQuestionError = {};

      if (!question.question.trim()) {
        error.question = 'Question title is required.';
      }

      if (question.type !== 'text') {
        const cleanOptions = question.options.map((option) => option.trim());

        if (cleanOptions.some((option) => option === '')) {
          error.options = 'Complete all option fields or remove unused options.';
        } else if (cleanOptions.length < 2) {
          error.options = 'At least 2 options are required.';
        }
      }

      if (error.question || error.options) {
        customErrors[question.id] = error;
        valid = false;
      }
    });

    setStep2Error(fixedError);
    setDynamicQuestionErrors(customErrors);
    return valid;
  };

  const handleStep2Next = () => {
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };


  const handleSubmitCampaign = async () => {
    // ------------------------------------------------------------
    // DUPLICATE SUBMISSION GUARD
    // ------------------------------------------------------------
    // If a request is already in progress, or this exact form has already
    // created a campaign successfully, do not allow another submission.
    if (isSubmitting || campaignCreated) {
      return;
    }

    // Defensive check in case Step 3 is reached by future UI changes.
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const payload = new FormData();
      if (
        role === "ADMIN"
      ) {
        payload.append(
          "brandId",
          selectedBrandId
        );
      }
      payload.append(
          "mode",
          mode
      );

      payload.append(
        "actorRole",
        role
      );

      payload.append('productName', formData.productName);
      payload.append('productLink', formData.productLink);
      payload.append('marketplace', formData.marketplace);
      payload.append('productDescription', formData.productDescription);
      payload.append('earning', formData.earning);
      payload.append('slots', formData.slots);
      payload.append('startDate', formData.startDate);
      payload.append('endDate', formData.endDate);
      payload.append('state', formData.state);
      payload.append('city', formData.city);
      payload.append('gender', formData.gender);
      payload.append('task4Required', String(formData.task4Required));

      formData.productImages.forEach((image) => {
        payload.append('productImages', image);
      });

      payload.append(
        'selectedFixedQuestionIds',
        JSON.stringify(selectedFixedQuestionIds)
      );

      payload.append(
        'customQuestions',
        JSON.stringify(
          dynamicQuestions.map((question) => ({
            type: question.type,
            question: question.question,
            options:
              question.type === 'text'
                ? []
                : question.options.filter((option) => option.trim() !== ''),
          }))
        )
      );

      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        credentials: 'include',
        body: payload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create campaign.');
      }

      const campaignCode = result.data?.campaignCode ?? "";

      const successMessage =
        role === "ADMIN"
          ? `Campaign ${campaignCode} has been successfully created by Admin.`
          : `Campaign ${campaignCode} has been successfully created and will be LIVE after Admin approval.`;

      // Lock this form after successful creation so the same campaign
      // cannot be submitted again accidentally.
      setCampaignCreated(true);

      setSubmitSuccess(successMessage);
            setResultModal({
              show: true,
              type: 'success',
              title: 'Campaign Created Successfully',
              message: successMessage,
            });

      console.log('Campaign created:', result.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create campaign.';

      setSubmitError(message);
      setResultModal({
        show: true,
        type: 'error',
        title: 'Campaign Creation Failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCampaignForm = () => {
    setFormData({
      productName: '',
      productImages: [],
      productLink: '',
      marketplace: '',
      productDescription: '',
      earning: '',
      slots: '',
      startDate: '',
      endDate: '',
      state: 'any',
      city: 'any',
      gender: 'ANY',
      task4Required: false,
    });
    setMarketplaceSelection("");
    setCustomMarketplace("");
    setSelectedBrandId("");
    setCities([]);
    setLocationError('');
    setSelectedFixedQuestionIds([]);
    setDynamicQuestions([]);
    setStep1Errors({});
    setStep2Error('');
    setDynamicQuestionErrors({});
    setSubmitError('');
    setSubmitSuccess('');

    // A fresh form is allowed to create a new campaign.
    setCampaignCreated(false);

    // Clear the rich-text editor as well as formData.
    productDescriptionEditor?.commands.clearContent();

    setCurrentStep(1);
    setResultModal((prev) => ({ ...prev, show: false }));
  };

  // ============================================================
  // RESULT MODAL CLOSE
  // ============================================================
  // After a successful creation, pressing X should not expose the old
  // submitted form again. Send the user to the campaign list instead.
  // For an error modal, simply close it so the user can correct/retry.
  const closeResultModal = () => {
    if (resultModal.type === 'success' && campaignCreated) {
      goToCampaignList();
      return;
    }

    setResultModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  // const goToCampaignList = () => {
  //   setResultModal((prev) => ({ ...prev, show: false }));
  //   router.push('/brand/campaigns/list');
  // };
  const goToCampaignList =
    () => {
      setResultModal(
        (prev) => ({
          ...prev,
          show: false,
        })
      );

      if (
        role === "ADMIN"
      ) {
        router.push(
          "/admin/campaigns"
        );

        return;
      }

      router.push(
        "/brand/campaigns/list"
      );
    };
    
  return (
    <div className="container py-4">
      {/* Progress Bar */}
      <div className="row mb-4 justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm border">
            <div className={`fw-bold ${currentStep === 1 ? 'text-primary' : 'text-muted'}`}>
              <span className="badge bg-primary me-2">1</span> Details
            </div>
            <div className="text-muted">&gt;</div>
            <div className={`fw-bold ${currentStep === 2 ? 'text-primary' : 'text-muted'}`}>
              <span className={`badge me-2 ${currentStep >= 2 ? 'bg-primary' : 'bg-secondary'}`}>
                2
              </span>{' '}
              Questionnaire
            </div>
            <div className="text-muted">&gt;</div>
            <div className={`fw-bold ${currentStep === 3 ? 'text-primary' : 'text-muted'}`}>
              <span className={`badge me-2 ${currentStep === 3 ? 'bg-primary' : 'bg-secondary'}`}>
                3
              </span>{' '}
              Review & Submit
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="card border-light shadow-sm p-4 h-100">
            {/* STEP 1: CAMPAIGN DETAILS */}
            {currentStep === 1 && (
              <div>
                <h5 className="card-title mb-4 text-primary">Step 1: Campaign Details</h5>
                <form onSubmit={(e) => e.preventDefault()}>
                  {Object.keys(step1Errors).length > 0 && (
                    <div className="alert alert-danger py-2" role="alert">
                      Please correct the highlighted required fields before continuing.
                    </div>
                  )}

                  <h6 className="fw-bold mb-3 border-bottom pb-2">Compulsory Details</h6>
                  {role === "ADMIN" && (
                    <div className="mb-4">

                      <label
                        htmlFor="brandId"
                        className="form-label-custom"
                      >
                        Brand *
                      </label>

                      <select
                        id="brandId"
                        className={`form-select ${
                          step1Errors.brandId
                            ? "is-invalid"
                            : ""
                        }`}
                        value={selectedBrandId}
                        disabled={loadingBrands}
                        onChange={(event) => {
                          setSelectedBrandId(
                            event.target.value
                          );
                          setStep1Errors(
                            (previous) => {
                              const next = {
                                ...previous,
                              };

                              delete next.brandId;

                              return next;
                            }
                          );
                        }}
                      >
                        <option value="">
                          {loadingBrands
                            ? "Loading Brands..."
                            : "Select Brand"}
                        </option>
                        {brands.map((brand) => (
                          <option
                            key={brand.id}
                            value={brand.id}
                          >
                            {brand.companyName}
                            {" — "}
                            {brand.category}
                          </option>
                        ))}
                      </select>
                      {step1Errors.brandId && (
                        <div className="invalid-feedback d-block">
                          {step1Errors.brandId}
                        </div>
                      )}
                      {brandError && (
                        <div className="text-danger small mt-2">
                          {brandError}
                        </div>
                      )}
                      {!loadingBrands &&
                        !brandError &&
                        brands.length === 0 && (
                          <div className="alert alert-warning py-2 mt-2 mb-0">
                            No approved Brands are available.
                            Approve a Brand before creating a campaign.
                          </div>
                        )}
                      <div className="form-text">
                        The campaign will belong to the selected Brand,
                        even though it is being created by Admin.
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="productName" className="form-label-custom">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${step1Errors.productName ? 'is-invalid' : ''}`}
                      id="productName"
                      placeholder="Enter product name"
                      value={formData.productName}
                      onChange={handleInputChange}
                    />
                    {step1Errors.productName && (
                      <div className="invalid-feedback d-block">{step1Errors.productName}</div>
                    )}
                  </div>
                                 <div className="mt-4">

                    <label className="form-label-custom fw-semibold mb-2">
                      Product Type
                    </label>

                    <div className="border rounded p-3 bg-light">

                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

                        <div>

                          <div className="fw-semibold">

                            {formData.task4Required
                              ? 'Physical Product'
                              : 'Digital Product'}

                          </div>

                          <div className="small text-muted mt-1">

                            {formData.task4Required
                              ? 'Physical Product campaigns include Task 1, Task 2, Task 3 and Task 4.'
                              : 'Digital Product campaigns include Task 1, Task 2 and Task 3.'}

                          </div>

                        </div>

                        <div className="d-flex align-items-center gap-2">

                          <span
                            className={
                              !formData.task4Required
                                ? 'fw-semibold text-primary'
                                : 'text-muted'
                            }
                          >
                            Digital
                          </span>

                          <div className="form-check form-switch mb-0">

                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="productTypeSwitch"
                              checked={formData.task4Required}
                              onChange={(event) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  task4Required:
                                    event.target.checked,
                                }))
                              }
                              style={{
                                width: '3rem',
                                height: '1.5rem',
                                cursor: 'pointer',
                              }}
                            />

                          </div>

                          <span
                            className={
                              formData.task4Required
                                ? 'fw-semibold text-primary'
                                : 'text-muted'
                            }
                          >
                            Physical
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>


                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="productImages" className="form-label-custom">
                        Product Images *
                      </label>
                      <input
                        type="file"
                        className={`form-control ${step1Errors.productImage ? 'is-invalid' : ''}`}
                        id="productImages"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleProductImagesChange}
                        disabled={formData.productImages.length >= 4}
                      />
                      <div className="form-text">
                        Upload 1 to 4 images. JPG, PNG or WEBP. Maximum 5 MB per image.
                        {formData.productImages.length > 0 &&
                          ` ${formData.productImages.length}/4 selected.`}
                      </div>

                      {formData.productImages.length > 0 && (
                        <div className="mt-2">
                          {formData.productImages.map((image, index) => (
                            <div
                              key={`${image.name}-${image.lastModified}-${index}`}
                              className="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-2 bg-light"
                            >
                              <div className="small text-truncate me-2">
                                <span className="fw-semibold">{index + 1}.</span>{' '}
                                {image.name}{' '}
                                <span className="text-muted">
                                  ({(image.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeProductImage(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {step1Errors.productImage && (
                        <div className="invalid-feedback d-block">{step1Errors.productImage}</div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="productLink" className="form-label-custom">
                        Product Link *
                      </label>
                      <input
                        type="url"
                        className={`form-control ${step1Errors.productLink ? 'is-invalid' : ''}`}
                        id="productLink"
                        placeholder="https://example.com/product"
                        value={formData.productLink}
                        onChange={handleInputChange}
                      />
                      {step1Errors.productLink && (
                        <div className="invalid-feedback d-block">{step1Errors.productLink}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="marketplace" className="form-label-custom">
                      Marketplace *
                    </label>

                    <select
                      className={`form-select ${
                        step1Errors.marketplace ? 'is-invalid' : ''
                      }`}
                      id="marketplace"
                      value={marketplaceSelection}
                      onChange={handleMarketplaceChange}
                    >
                      <option value="">Select Marketplace</option>
                      <option value="Amazon">Amazon</option>
                      <option value="Flipkart">Flipkart</option>
                      <option value="Myntra">Myntra</option>
                      <option value="Meesho">Meesho</option>
                      <option value="Blinkit">Blinkit</option>
                      <option value="Zepto">Zepto</option>
                      <option value="BigBasket">BigBasket</option>
                      <option value="Swiggy Instamart">Swiggy Instamart</option>
                      <option value="Brand’s Website">Brand’s Website</option>
                      <option value="AJIO">AJIO</option>
                      <option value="Other">Other</option>
                    </select>

                    {marketplaceSelection === 'Other' && (
                      <div className="mt-3">
                        <label
                          htmlFor="customMarketplace"
                          className="form-label-custom"
                        >
                          Enter Marketplace Name *
                        </label>

                        <input
                          type="text"
                          id="customMarketplace"
                          className={`form-control ${
                            step1Errors.marketplace ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter marketplace name"
                          maxLength={100}
                          value={customMarketplace}
                          onChange={handleCustomMarketplaceChange}
                        />
                      </div>
                    )}

                    {step1Errors.marketplace && (
                      <div className="invalid-feedback d-block">
                        {step1Errors.marketplace}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">
                      Product Description *
                    </label>

                    <div
                      className={`border rounded ${
                        step1Errors.productDescription
                          ? 'border-danger'
                          : ''
                      }`}
                    >
                      {/* Rich Text Toolbar */}
                      <div className="d-flex flex-wrap gap-2 p-2 border-bottom bg-light">
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            productDescriptionEditor?.isActive('bold')
                              ? 'btn-primary'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() =>
                            productDescriptionEditor
                              ?.chain()
                              .focus()
                              .toggleBold()
                              .run()
                          }
                          disabled={!productDescriptionEditor}
                          title="Bold"
                        >
                          <i className="bi bi-type-bold"></i>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            productDescriptionEditor?.isActive('italic')
                              ? 'btn-primary'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() =>
                            productDescriptionEditor
                              ?.chain()
                              .focus()
                              .toggleItalic()
                              .run()
                          }
                          disabled={!productDescriptionEditor}
                          title="Italic"
                        >
                          <i className="bi bi-type-italic"></i>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            productDescriptionEditor?.isActive(
                              'heading',
                              { level: 2 }
                            )
                              ? 'btn-primary'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() =>
                            productDescriptionEditor
                              ?.chain()
                              .focus()
                              .toggleHeading({ level: 2 })
                              .run()
                          }
                          disabled={!productDescriptionEditor}
                          title="Heading"
                        >
                          H2
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            productDescriptionEditor?.isActive('bulletList')
                              ? 'btn-primary'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() =>
                            productDescriptionEditor
                              ?.chain()
                              .focus()
                              .toggleBulletList()
                              .run()
                          }
                          disabled={!productDescriptionEditor}
                          title="Bullet List"
                        >
                          <i className="bi bi-list-ul"></i>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            productDescriptionEditor?.isActive('orderedList')
                              ? 'btn-primary'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() =>
                            productDescriptionEditor
                              ?.chain()
                              .focus()
                              .toggleOrderedList()
                              .run()
                          }
                          disabled={!productDescriptionEditor}
                          title="Numbered List"
                        >
                          <i className="bi bi-list-ol"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            productDescriptionEditor
                              ?.chain()
                              .focus()
                              .undo()
                              .run()
                          }
                          disabled={
                            !productDescriptionEditor ||
                            !productDescriptionEditor.can().undo()
                          }
                          title="Undo"
                        >
                          <i className="bi bi-arrow-counterclockwise"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            productDescriptionEditor
                              ?.chain()
                              .focus()
                              .redo()
                              .run()
                          }
                          disabled={
                            !productDescriptionEditor ||
                            !productDescriptionEditor.can().redo()
                          }
                          title="Redo"
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                        </button>
                      </div>

                      {/* Editor */}
                      <EditorContent
                        id="productDescription"
                        editor={productDescriptionEditor}
                      />
                    </div>

                    <div className="form-text">
                      Use the toolbar to format the product description.
                    </div>

                    {step1Errors.productDescription && (
                      <div className="invalid-feedback d-block">
                        {step1Errors.productDescription}
                      </div>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="earning" className="form-label-custom">
                        Earning per Tester (₹) *
                      </label>
                      <input
                        type="number"
                        className={`form-control ${step1Errors.earning ? 'is-invalid' : ''}`}
                        id="earning"
                        placeholder="e.g. 500"
                        value={formData.earning}
                        onChange={handleInputChange}
                      />
                      {step1Errors.earning && (
                        <div className="invalid-feedback d-block">{step1Errors.earning}</div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="slots" className="form-label-custom">
                        Total Slots *
                      </label>
                      <input
                        type="number"
                        className={`form-control ${step1Errors.slots ? 'is-invalid' : ''}`}
                        id="slots"
                        placeholder="e.g. 50"
                        value={formData.slots}
                        onChange={handleInputChange}
                      />
                      {step1Errors.slots && (
                        <div className="invalid-feedback d-block">{step1Errors.slots}</div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="startDate" className="form-label-custom">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        className={`form-control ${step1Errors.startDate ? 'is-invalid' : ''}`}
                        id="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                      />
                      {step1Errors.startDate && (
                        <div className="invalid-feedback d-block">{step1Errors.startDate}</div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="endDate" className="form-label-custom">
                        End Date *
                      </label>
                      <input
                        type="date"
                        className={`form-control ${step1Errors.endDate ? 'is-invalid' : ''}`}
                        id="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                      {step1Errors.endDate && (
                        <div className="invalid-feedback d-block">{step1Errors.endDate}</div>
                      )}
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 border-bottom pb-2 mt-4">
                    Optional Targeting Filters (Default: Any)
                  </h6>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="state" className="form-label-custom">
                        State
                      </label>
                      <select
                        className="form-select"
                        id="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        disabled={loadingStates}
                      >
                        <option value="any">
                          {loadingStates ? 'Loading States...' : 'Any State'}
                        </option>
                        {states.map((state) => (
                          <option value={state} key={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="city" className="form-label-custom">
                        City
                      </label>
                      <select
                        className="form-select"
                        id="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={formData.state === 'any' || loadingCities}
                      >
                        <option value="any">
                          {loadingCities
                            ? 'Loading Cities...'
                            : formData.state === 'any'
                              ? 'Select State First'
                              : 'Any City'}
                        </option>
                        {cities.map((city) => (
                          <option value={city} key={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="gender" className="form-label-custom">
                        Gender
                      </label>
                      <select
                        className="form-select"
                        id="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="ANY">Any</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  {locationError && (
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {locationError}
                    </div>
                  )}

                  {/* <div className="form-check mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="task4Required"
                      checked={formData.task4Required}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="task4Required">
                      Task 4 required for this campaign
                    </label>
                  </div> */}
   
                  <div className="d-flex justify-content-end mt-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleStep1Next}
                    >
                      Next: Questionnaire &gt;
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: QUESTIONNAIRE */}
            {currentStep === 2 && (
              <div>
                <h5 className="card-title mb-4 text-primary">Step 2: Questionnaire Configuration</h5>

                <form onSubmit={(e) => e.preventDefault()}>
                  {/* Fixed Questions checklist */}
                  <h6 className="fw-bold mb-3 border-bottom pb-2">
                    Fixed Questions * (Select at least one)
                  </h6>
                  <div className="mb-4">
                    {loadingFixedQuestions && (
                      <div className="text-muted">Loading fixed questions...</div>
                    )}

                    {fixedQuestionsError && (
                      <div className="alert alert-danger py-2">{fixedQuestionsError}</div>
                    )}

                    {step2Error && (
                      <div className="alert alert-danger py-2" role="alert">
                        {step2Error}
                      </div>
                    )}

                    {!loadingFixedQuestions &&
                      !fixedQuestionsError &&
                      fixedQuestions.length === 0 && (
                        <div className="text-muted">No active fixed questions found.</div>
                      )}

                    {!loadingFixedQuestions &&
                      !fixedQuestionsError &&
                      fixedQuestions.map((question, index) => (
                        <div className="form-check mb-2" key={question.id}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`fixed-question-${question.id}`}
                            checked={selectedFixedQuestionIds.includes(question.id)}
                            onChange={() => handleFixedQuestionToggle(question.id)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`fixed-question-${question.id}`}
                          >
                            {index + 1}. {question.questionText}
                          </label>
                        </div>
                      ))}
                  </div>

                  {/* Dynamic Questions */}
                  {/* <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <h6 className="fw-bold mb-0">Dynamic Questions (Up to 5)</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addQuestion}
                      disabled={dynamicQuestions.length >= 5}
                    >
                      + Add Question
                    </button>
                  </div> */}

                  {dynamicQuestions.map((q, index) => (
                    <div key={q.id} className="mb-4 p-3 bg-light rounded border">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold text-secondary">Question {index + 1}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeQuestion(q.id)}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-8">
                          <label className="form-label-custom fw-semibold">Question Title</label>
                          <input
                            type="text"
                            className={`form-control ${dynamicQuestionErrors[q.id]?.question ? 'is-invalid' : ''}`}
                            placeholder="Enter question text"
                            value={q.question}
                            onChange={(e) => updateQuestionTitle(q.id, e.target.value)}
                          />
                          {dynamicQuestionErrors[q.id]?.question && (
                            <div className="invalid-feedback d-block">
                              {dynamicQuestionErrors[q.id]?.question}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4">
                          <label className="form-label-custom fw-semibold">Question Type</label>
                          <select
                            className="form-select"
                            value={q.type}
                            onChange={(e) => updateQuestionType(q.id, e.target.value as any)}
                          >
                            <option value="radio">Radio Choice</option>
                            <option value="checkbox">Multiple Checkbox</option>
                            <option value="text">Text Response</option>
                          </select>
                        </div>
                      </div>

                      {q.type === 'text' ? (
                        <div className="mt-2">
                          <label className="form-label-custom text-muted small">
                            Tester Input Preview
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Tester will type text answer..."
                            disabled
                          />
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label-custom text-muted small mb-0">
                              Options (Up to 4)
                            </label>
                            {q.options.length < 4 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-decoration-none p-0"
                                onClick={() => addOption(q.id)}
                              >
                                + Add Option
                              </button>
                            )}
                          </div>

                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="input-group mb-2">
                              <span className="input-group-text bg-white">
                                {q.type === 'radio' ? '○' : '☐'}
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) =>
                                  updateOptionText(q.id, optIdx, e.target.value)
                                }
                              />
                              {q.options.length > 1 && (
                                <button
                                  className="btn btn-outline-secondary text-danger"
                                  type="button"
                                  onClick={() => removeOption(q.id, optIdx)}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          {dynamicQuestionErrors[q.id]?.options && (
                            <div className="text-danger small mt-1">
                              {dynamicQuestionErrors[q.id]?.options}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCurrentStep(1)}
                    >
                      &lt; Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleStep2Next}
                    >
                      Next: Review &gt;
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: FULL REVIEW & SUBMIT */}
            {currentStep === 3 && (
              <div>
                <h5 className="card-title mb-4 text-primary">Step 3: Campaign Review</h5>

                 {/* ============================================
                      ADMIN SELECTED BRAND
                  ============================================ */}

                {role === "ADMIN" && (
                  <div className="bg-light p-3 rounded border mb-4">

                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">

                      <h6 className="fw-bold mb-0">
                        Brand
                      </h6>

                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none"
                        onClick={() =>
                          setCurrentStep(1)
                        }
                      >
                        Edit
                      </button>

                    </div>

                    <div className="row g-2">

                      <div className="col-md-6">

                        <span className="text-muted">
                          Brand Name:{" "}
                        </span>

                        <span className="fw-semibold">

                          {brands.find(
                            (brand) =>
                              brand.id ===
                              Number(
                                selectedBrandId
                              )
                          )?.companyName ??
                            "N/A"}

                        </span>

                      </div>

                      <div className="col-md-6">

                        <span className="text-muted">
                          Category:{" "}
                        </span>

                        <span className="fw-semibold">

                          {brands.find(
                            (brand) =>
                              brand.id ===
                              Number(
                                selectedBrandId
                              )
                          )?.category ??
                            "N/A"}

                        </span>

                      </div>

                      <div className="col-md-6">

                        <span className="text-muted">
                          Company Type:{" "}
                        </span>

                        <span className="fw-semibold">

                          {brands.find(
                            (brand) =>
                              brand.id ===
                              Number(
                                selectedBrandId
                              )
                          )?.companyType ??
                            "N/A"}

                        </span>

                      </div>

                    </div>

                  </div>
                )}

                {/* Section 1: Campaign Details */}
                <div className="bg-light p-3 rounded border mb-4">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h6 className="fw-bold mb-0">1. Basic Details</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                      onClick={() => setCurrentStep(1)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <span className="text-muted">Product Name: </span>
                      <span className="fw-semibold">{formData.productName || 'N/A'}</span>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">Product Images: </span>
                      <span className="fw-semibold">{formData.productImages.length} selected</span>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">Product Link: </span>
                      <a
                        href={formData.productLink || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="fw-semibold"
                      >
                        {formData.productLink || 'N/A'}
                      </a>
                    </div>
                     <div className="col-md-6">
                      <span className="text-muted">Marketplace: </span>
                      <span className="fw-semibold">
                        {formData.marketplace || 'N/A'}
                      </span>
                    </div>
                    <div className="col-12 mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted fw-semibold">Product Image Preview</span>
                        <span className="badge bg-secondary">
                          {formData.productImages.length}/4 images
                        </span>
                      </div>

                      {productImagePreviews.length > 0 ? (
                        <div className="row g-3">
                          {productImagePreviews.map((previewUrl, index) => (
                            <div className="col-6 col-md-3" key={`${formData.productImages[index]?.name}-${index}`}>
                              <div className="card h-100 shadow-sm border">
                                <div
                                  className="d-flex align-items-center justify-content-center bg-white rounded-top"
                                  style={{ height: '150px', overflow: 'hidden' }}
                                >
                                  <img
                                    src={previewUrl}
                                    alt={`Product image ${index + 1}`}
                                    className="img-fluid"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                    }}
                                  />
                                </div>
                                <div className="card-body p-2">
                                  <div
                                    className="small fw-semibold text-truncate"
                                    title={formData.productImages[index]?.name}
                                  >
                                    {formData.productImages[index]?.name}
                                  </div>
                                  <div className="small text-muted">
                                    {formData.productImages[index]
                                      ? `${(formData.productImages[index].size / (1024 * 1024)).toFixed(2)} MB`
                                      : ''}
                                  </div>
                                  {index === 0 && (
                                    <span className="badge bg-primary mt-1">Primary Image</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">No product images selected.</div>
                      )}
                    </div>

                    <div className="col-12">
                      <div className="text-muted mb-1">
                        Description:
                      </div>

                      {formData.productDescription ? (
                        <div
                          className="border rounded bg-white p-3"
                          dangerouslySetInnerHTML={{
                            __html: formData.productDescription,
                          }}
                        />
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">Earning / Slots: </span>
                      <span className="fw-semibold">
                        ₹{formData.earning || '0'} per tester / {formData.slots || '0'} slots
                      </span>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted">Duration: </span>
                      <span className="fw-semibold">
                        {formData.startDate || 'N/A'} to {formData.endDate || 'N/A'}
                      </span>
                    </div>
                    <div className="col-12">
                      <span className="text-muted">Targeting Filters: </span>
                      <span className="badge bg-secondary me-1">State: {formData.state}</span>
                      <span className="badge bg-secondary me-1">City: {formData.city}</span>
                      <span className="badge bg-secondary me-1">Gender: {formData.gender}</span>
                      <span className="badge bg-secondary">Task 4: {formData.task4Required ? 'Required' : 'Not Required'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Questionnaire Review */}
                <div className="bg-light p-3 rounded border mb-4">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h6 className="fw-bold mb-0">2. Questionnaire</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                      onClick={() => setCurrentStep(2)}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Selected Fixed Questions */}
                  <div className="mb-3">
                    <span className="text-muted d-block mb-1 fw-semibold">
                      Selected Fixed Questions:
                    </span>
                    <ul className="list-unstyled mb-0 ps-2">
                      {fixedQuestions
                        .filter((question) => selectedFixedQuestionIds.includes(question.id))
                        .map((question, index) => (
                          <li key={question.id}>
                            ✓ {index + 1}. {question.questionText}
                          </li>
                        ))}

                      {selectedFixedQuestionIds.length === 0 && (
                        <li className="text-muted italic">None selected</li>
                      )}
                    </ul>
                  </div>

                  {/* Custom Dynamic Questions */}
                  <div>
                    <span className="text-muted d-block mb-1 fw-semibold">
                      Custom Dynamic Questions ({dynamicQuestions.length}):
                    </span>
                    {dynamicQuestions.length === 0 ? (
                      <span className="text-muted ps-2">No custom questions added.</span>
                    ) : (
                      <ol className="ps-3 mb-0">
                        {dynamicQuestions.map((dq) => (
                          <li key={dq.id} className="mb-2">
                            <span className="fw-semibold">{dq.question || 'Untitled'}</span>{' '}
                            <span className="badge bg-info text-dark ms-1">{dq.type}</span>
                            {dq.type !== 'text' && (
                              <div className="ps-2 mt-1 small text-muted">
                                Options: {dq.options.filter((o) => o.trim() !== '').join(', ')}
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    &lt; Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-success px-4"
                    onClick={handleSubmitCampaign}
                    disabled={isSubmitting || campaignCreated}
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : campaignCreated
                        ? 'Campaign Submitted'
                        : 'Submit Campaign'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {resultModal.show && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className={`modal-header ${resultModal.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  <h5 className="modal-title">{resultModal.title}</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={closeResultModal}
                  />
                </div>

                <div className="modal-body">
                  <p className="mb-0">{resultModal.message}</p>
                </div>

                <div className="modal-footer">
                  {resultModal.type === 'success' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={resetCampaignForm}
                      >
                        Create More Campaign
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={goToCampaignList}
                      >
                        Go to Campaign List
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={closeResultModal}
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}