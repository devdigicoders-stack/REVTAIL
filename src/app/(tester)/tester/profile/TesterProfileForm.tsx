"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type InterestOption = {
  id: number;
  name: string;
};

type SelectedInterest = {
  id?: number;
  interestId?: number;
  name?: string;

  interest?: {
    id: number;
    name: string;
  };
};

type BankDetails = {
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumberLast4?: string | null;
  ifscCode?: string | null;
  upiId?: string | null;
  isVerified?: boolean;
};

type TesterProfile = {
  id?: number;

  fullName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;

  pinCode?: string | null;
  city?: string | null;
  state?: string | null;

  profileImage?: string | null;
  instagramId?: string | null;

  approvalStatus?: string | null;

  interests?: SelectedInterest[];

  bankDetails?: BankDetails | null;

  user?: {
    email?: string | null;
    mobile?: string | null;
  };
};

type Props = {
  userId: number;
};

export default function TesterProfileForm({
  userId,
}: Props) {
  // ============================================================
  // PROFILE STATE
  // ============================================================

  const [profile, setProfile] =
    useState<TesterProfile | null>(null);

  const [email, setEmail] =
    useState("");

  const [profileImage, setProfileImage] =
    useState("");

  const [
    profileImageFile,
    setProfileImageFile,
  ] = useState<File | null>(null);

  const [
    profileImageUploading,
    setProfileImageUploading,
  ] = useState(false);

  const [instagramId, setInstagramId] =
    useState("");

  // ============================================================
  // INTEREST STATE
  // ============================================================

  const [interestOptions, setInterestOptions] =
    useState<InterestOption[]>([]);

  const [selectedInterestIds, setSelectedInterestIds] =
    useState<number[]>([]);

  // ============================================================
  // BANK STATE
  // ============================================================

  const [
    accountHolderName,
    setAccountHolderName,
  ] = useState("");

  const [bankName, setBankName] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [showAccountNumber, setShowAccountNumber] =
    useState(false);

  const [ifscCode, setIfscCode] =
    useState("");

  const [upiId, setUpiId] =
    useState("");

  // ============================================================
  // UI STATE
  // ============================================================

  const [loading, setLoading] =
    useState(true);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [interestSaving, setInterestSaving] =
    useState(false);

  const [bankSaving, setBankSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // Display validation and save feedback inside the edited section.
  const [messageSection, setMessageSection] =
    useState<"profile" | "interests" | "bank" | null>(null);

  // Edit modes: fields remain read-only until their section is opened.
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImageFile]);

  function cancelProfileEdit() {
    setEmail(profile?.user?.email ?? "");
    setInstagramId(profile?.instagramId ?? "");
    setProfileImage(profile?.profileImage ?? "");
    setProfileImageFile(null);
    setEditingProfile(false);
    resetMessages();
  }

  function cancelInterestsEdit() {
    const savedIds = (profile?.interests ?? [])
      .map((item) => item.interest?.id ?? item.interestId ?? item.id ?? null)
      .filter((id): id is number => typeof id === "number");
    setSelectedInterestIds(savedIds);
    setEditingInterests(false);
    resetMessages();
  }

  function cancelBankEdit() {
    setAccountHolderName(profile?.bankDetails?.accountHolderName ?? "");
    setBankName(profile?.bankDetails?.bankName ?? "");
    setIfscCode(profile?.bankDetails?.ifscCode ?? "");
    setUpiId(profile?.bankDetails?.upiId ?? "");
    setAccountNumber("");
    setShowAccountNumber(false);
    setEditingBank(false);
    resetMessages();
  }

  // ============================================================
  // GET PROFILE
  // ============================================================

  const loadProfile = useCallback(
    async () => {
      try {
        const response = await fetch(
          `/api/tester/profile?userId=${userId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load profile."
          );
        }

        /*
         * Supports either:
         *
         * data.profile
         * data.testerProfile
         * data
         *
         * Remove the fallback variants once your
         * exact API response structure is fixed.
         */

        const data =
          result.data ?? {};

        const loadedProfile: TesterProfile =
          data.profile ??
          data.testerProfile ??
          data;

        setProfile(loadedProfile);

        // ------------------------------------------------------
        // Personal/profile fields
        // ------------------------------------------------------

        const loadedEmail =
          loadedProfile.user?.email ??
          data.user?.email ??
          "";

        setEmail(loadedEmail);

        setProfileImage(
          loadedProfile.profileImage ?? ""
        );

        setInstagramId(
          loadedProfile.instagramId ?? ""
        );

        // ------------------------------------------------------
        // Existing interests
        // ------------------------------------------------------

        const profileInterests =
          loadedProfile.interests ?? [];

        const interestIds =
          profileInterests
            .map((item) => {
              if (item.interest?.id) {
                return item.interest.id;
              }

              if (item.interestId) {
                return item.interestId;
              }

              return item.id ?? null;
            })
            .filter(
              (id): id is number =>
                typeof id === "number"
            );

        setSelectedInterestIds(
          interestIds
        );

        // ------------------------------------------------------
        // Bank fields
        // ------------------------------------------------------

        const bank =
          loadedProfile.bankDetails ??
          data.bankDetails ??
          null;

        if (bank) {
          setAccountHolderName(
            bank.accountHolderName ?? ""
          );

          setBankName(
            bank.bankName ?? ""
          );

          setIfscCode(
            bank.ifscCode ?? ""
          );

          setUpiId(
            bank.upiId ?? ""
          );

          /*
           * Do NOT populate accountNumber with masked number.
           *
           * User should re-enter the account number only
           * when they want to update bank details.
           */
          setAccountNumber("");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load profile."
        );
      }
    },
    [userId]
  );

  // ============================================================
  // GET INTEREST MASTER
  // ============================================================

  const loadInterests = useCallback(
    async () => {
      try {
        const response =
          await fetch(
            "/api/interests",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load interests."
          );
        }

        const interests =
          result.data?.interests ??
          result.data ??
          [];

        setInterestOptions(
          Array.isArray(interests)
            ? interests
            : []
        );
      } catch (err) {
        console.error(
          "Load interests error:",
          err
        );
      }
    },
    []
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    async function load() {
      setLoading(true);

      await Promise.all([
        loadProfile(),
        loadInterests(),
      ]);

      setLoading(false);
    }

    load();
  }, [
    loadProfile,
    loadInterests,
  ]);

  // ============================================================
  // PROFILE COMPLETION %
  // ============================================================

  const completionPercentage =
    useMemo(() => {
      const checks = [
        Boolean(email.trim()),
        Boolean(profileImage.trim()),
        Boolean(instagramId.trim()),
        selectedInterestIds.length >= 5,
        Boolean(
          profile?.bankDetails
        ),
      ];

      const completed =
        checks.filter(Boolean).length;

      return Math.round(
        (completed / checks.length) *
          100
      );
    }, [
      email,
      profileImage,
      instagramId,
      selectedInterestIds,
      profile,
    ]);

  // ============================================================
  // MESSAGE HELPERS
  // ============================================================

  function resetMessages() {
    setMessage("");
    setError("");
    setMessageSection(null);
  }

  // ============================================================
  // PROFILE IMAGE
  // POST /api/tester/profile/image
  // ============================================================

  function handleProfileImageChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    resetMessages();
    setMessageSection("profile");

    const file =
      event.target.files?.[0] ??
      null;

    if (!file) {
      setProfileImageFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setProfileImageFile(null);

      setError(
        "Profile image must be JPG, PNG or WEBP."
      );

      event.target.value = "";

      return;
    }

    const maxFileSize =
      5 * 1024 * 1024;

    if (
      file.size >
      maxFileSize
    ) {
      setProfileImageFile(null);

      setError(
        "Profile image must be 5 MB or smaller."
      );

      event.target.value = "";

      return;
    }

    setProfileImageFile(
      file
    );
  }

  // Upload the selected image as part of Save Profile, not separately.
  async function uploadSelectedProfileImage(file: File): Promise<string> {
    setProfileImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await fetch("/api/tester/profile/image", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to upload profile image.");
      }

      const uploadedImage = result.data?.profileImage;
      if (!uploadedImage || typeof uploadedImage !== "string") {
        throw new Error("Profile image URL was not returned.");
      }

      return uploadedImage;
    } finally {
      setProfileImageUploading(false);
    }
  }

  // ============================================================
  // SAVE BASIC PROFILE
  // PATCH /api/tester/profile/complete
  // ============================================================

  async function handleProfileSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    resetMessages();
    setMessageSection("profile");

    setProfileSaving(true);

    try {
      // The existing image API uploads/persists the selected file.
      // Then the existing profile API saves the other profile fields.
      const savedProfileImage = profileImageFile
        ? await uploadSelectedProfileImage(profileImageFile)
        : profileImage;

      const response =
        await fetch(
          "/api/tester/profile/complete",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId,
              email:
                email.trim() || null,

              profileImage:
                savedProfileImage.trim() ||
                null,

              instagramId:
                instagramId.trim() ||
                null,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update profile."
        );
      }

      setProfileImage(savedProfileImage);
      setProfileImageFile(null);
      setMessage(
        "Profile information updated successfully."
      );

      await loadProfile();
      setEditingProfile(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // ============================================================
  // SELECT / DESELECT INTEREST
  // ============================================================

  function toggleInterest(
    interestId: number
  ) {
    resetMessages();

    setSelectedInterestIds(
      (current) => {
        if (
          current.includes(
            interestId
          )
        ) {
          return current.filter(
            (id) =>
              id !== interestId
          );
        }

        return [
          ...current,
          interestId,
        ];
      }
    );
  }

  // ============================================================
  // SAVE INTERESTS
  // PUT /api/tester/profile/interests
  // ============================================================

  async function handleInterestSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    resetMessages();
    setMessageSection("interests");

    if (
      selectedInterestIds.length <
      5
    ) {
      setError(
        "Please select at least 5 interests."
      );

      return;
    }

    setInterestSaving(true);

    try {
      const response =
        await fetch(
          "/api/tester/profile/interests",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId,
              interestIds:
                selectedInterestIds,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update interests."
        );
      }

      setMessage(
        "Interests updated successfully."
      );

      await loadProfile();
      setEditingInterests(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update interests."
      );
    } finally {
      setInterestSaving(false);
    }
  }

  // ============================================================
  // SAVE BANK DETAILS
  // PUT /api/tester/profile/bank-details
  // ============================================================

  async function handleBankSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    resetMessages();
    setMessageSection("bank");

    if (
      !accountHolderName.trim() ||
      !bankName.trim() ||
      !accountNumber.trim() ||
      !ifscCode.trim()
    ) {
      setError(
        "Account holder name, bank name, account number and IFSC are required."
      );

      return;
    }

    setBankSaving(true);

    try {
      const response =
        await fetch(
          "/api/tester/profile/bank-details",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId,

              accountHolderName:
                accountHolderName.trim(),

              bankName:
                bankName.trim(),

              accountNumber:
                accountNumber.trim(),

              ifscCode:
                ifscCode
                  .trim()
                  .toUpperCase(),

              upiId:
                upiId.trim() || null,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update bank details."
        );
      }

      setMessage(
        "Bank details updated successfully."
      );

      setAccountNumber("");
      setShowAccountNumber(false);

      await loadProfile();
      setEditingBank(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update bank details."
      );
    } finally {
      setBankSaving(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body py-5 text-center">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <div className="text-muted mt-3">
            Loading your profile...
          </div>

        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="tester-profile-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="tester-profile-header">

        <div>
          <h3 className="fw-bold mb-1">
            My Profile
          </h3>

          <p className="text-muted mb-0">
            Complete your profile to get
            better campaign matches.
          </p>
        </div>

        <div className="tester-profile-completion">

          <strong>
            {completionPercentage}%
          </strong>

          <span>
            Complete
          </span>

        </div>

      </div>

      {/* ======================================================
          PROGRESS
      ====================================================== */}

      {/* <div className="card border-0 shadow-sm mb-4">

        <div className="card-body">

          <div className="d-flex justify-content-between mb-2">

            <span className="fw-semibold">
              Profile completion
            </span>

            <span className="text-muted">
              {completionPercentage}%
            </span>

          </div>

          <div
            className="progress"
            style={{
              height: "8px",
            }}
          >
            <div
              className="progress-bar"
              style={{
                width:
                  `${completionPercentage}%`,
              }}
              aria-valuenow={
                completionPercentage
              }
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

        </div>

      </div> */}

      {/* ======================================================
          MESSAGE
      ====================================================== */}

      {error && !messageSection && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      <div className="row g-4">

        {/* ====================================================
            LEFT SIDE
        ==================================================== */}

        <div className="col-xl-8 order-2 order-md-1">

          {/* ==================================================
              ACCOUNT INFORMATION
          ================================================== */}

          <div className="card border-0 shadow-sm tester-profile-card mb-4">

            <div className="card-header bg-white border-0">

              <h5 className="fw-bold mb-1">
                Account Information
              </h5>

              <p className="text-muted small mb-0">
                Information provided during
                registration.
              </p>

            </div>

            <div className="card-body">

              <div className="row g-3">

                <ReadOnlyField
                  label="Full Name"
                  value={
                    profile?.fullName
                  }
                />

                <ReadOnlyField
                  label="Mobile Number"
                  value={
                    profile?.user
                      ?.mobile
                  }
                />

                <ReadOnlyField
                  label="Gender"
                  value={
                    profile?.gender
                  }
                />

                <ReadOnlyField
                  label="PIN Code"
                  value={
                    profile?.pinCode
                  }
                />

                <ReadOnlyField
                  label="City"
                  value={
                    profile?.city
                  }
                />

                <ReadOnlyField
                  label="State"
                  value={
                    profile?.state
                  }
                />

              </div>

            </div>

          </div>

          {/* ==================================================
              PROFILE DETAILS
          ================================================== */}

          <form
            onSubmit={
              handleProfileSubmit
            }
          >

            <div className="card border-0 shadow-sm tester-profile-card mb-4">

              <div className="card-header bg-white border-0">

                <h5 className="fw-bold mb-1">
                  Profile Details
                </h5>

                <p className="text-muted small mb-0">
                  Update your public and
                  contact information.
                </p>

              </div>

              <div className="card-body">

                {messageSection === "profile" && message && (
                  <div className="alert alert-success" role="status">
                    <i className="bi bi-check-circle me-2"></i>
                    {message}
                  </div>
                )}

                {messageSection === "profile" && error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}


                <div className="row g-3">

                  {/* Email */}

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Email Address
                    </label>

                    <input
                      type="email"
                      disabled={!editingProfile}
                      className="form-control"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="your@email.com"
                    />

                  </div>

                  {/* Instagram */}

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Instagram ID
                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        @
                      </span>

                      <input
                        type="text"
                        disabled={!editingProfile}
                        className="form-control"
                        value={
                          instagramId
                        }
                        onChange={(event) =>
                          setInstagramId(
                            event.target.value
                          )
                        }
                        placeholder="username"
                      />

                    </div>

                  </div>

                  {/* Profile Image */}

                  <div className="col-12">

                    <label className="form-label fw-semibold">
                      Profile Image
                    </label>

                    <div className="border rounded-3 p-3">

                      <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">

                        <div
                          className="rounded-circle overflow-hidden bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width:
                              "88px",

                            height:
                              "88px",
                          }}
                        >

                          {profileImagePreview || profileImage ? (

                            <img
                              src={
                                profileImagePreview || profileImage
                              }
                              alt={
                                profile?.fullName ??
                                "Tester profile"
                              }
                              style={{
                                width:
                                  "100%",

                                height:
                                  "100%",

                                objectFit:
                                  "cover",
                              }}
                            />

                          ) : (

                            <i className="bi bi-person fs-2 text-muted"></i>

                          )}

                        </div>

                        <div className="flex-grow-1">

                          <input
                            type="file"
                            className="form-control"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={
                              handleProfileImageChange
                            }
                            disabled={
                              profileImageUploading || !editingProfile
                            }
                          />

                          <div className="form-text">
                            JPG, PNG or WEBP. Maximum file size 5 MB.
                          </div>

                          {profileImageFile && (

                            <div className="small text-muted mt-2">

                              Selected:{" "}

                              <strong>
                                {
                                  profileImageFile.name
                                }
                              </strong>

                            </div>

                          )}


                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              <div className="card-footer bg-white border-0">
                {editingProfile ? (
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={profileSaving || profileImageUploading}
                    >
                      {profileSaving || profileImageUploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Save Profile
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={profileSaving || profileImageUploading}
                      onClick={cancelProfileEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setEditingProfile(true)}
                  >
                    <i className="bi bi-pencil-square me-2"></i>
                    Edit
                  </button>
                )}
              </div>

            </div>

          </form>

          {/* ==================================================
              INTERESTS
          ================================================== */}

          <form
            onSubmit={
              handleInterestSubmit
            }
          >

            <div className="card border-0 shadow-sm tester-profile-card mb-4">

              <div className="card-header bg-white border-0">

                <div className="d-flex justify-content-between align-items-start gap-3">

                  <div>
                    <h5 className="fw-bold mb-1">
                      Interests
                    </h5>

                    <p className="text-muted small mb-0">
                      Select at least 5 categories
                      you are interested in.
                    </p>
                  </div>

                  <span
                    className={`badge ${
                      selectedInterestIds.length >= 5
                        ? "bg-success"
                        : "bg-light text-dark"
                    }`}
                  >
                    {
                      selectedInterestIds.length
                    }{" "}
                    selected
                  </span>

                </div>

              </div>

              <div className="card-body">

                {messageSection === "interests" && message && (
                  <div className="alert alert-success" role="status">
                    <i className="bi bi-check-circle me-2"></i>
                    {message}
                  </div>
                )}

                {messageSection === "interests" && error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}


                {interestOptions.length ===
                0 ? (

                  <div className="text-muted">
                    No interests available.
                  </div>

                ) : (

                  <div className="tester-interest-grid">

                    {interestOptions.map(
                      (interest) => {

                        const checked =
                          selectedInterestIds.includes(
                            interest.id
                          );

                        return (
                          <label
                            key={
                              interest.id
                            }
                            className={`tester-interest-option ${
                              checked
                                ? "selected"
                                : ""
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              disabled={!editingInterests}
                              onChange={() =>
                                toggleInterest(
                                  interest.id
                                )
                              }
                            />

                            <span>
                              {
                                interest.name
                              }
                            </span>

                          </label>
                        );
                      }
                    )}

                  </div>

                )}

                <div className="form-text mt-3">
                  Please select at least 5 interests.
                  You can select more than 5.
                </div>

              </div>

              <div className="card-footer bg-white border-0">
                {editingInterests ? (
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={interestSaving || selectedInterestIds.length < 5}
                    >
                      {interestSaving ? "Saving..." : "Save Interests"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={interestSaving}
                      onClick={cancelInterestsEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setEditingInterests(true)}
                  >
                    <i className="bi bi-pencil-square me-2"></i>
                    Edit
                  </button>
                )}
              </div>

            </div>

          </form>

          {/* ==================================================
              BANK DETAILS
          ================================================== */}

          <form
            onSubmit={
              handleBankSubmit
            }
          >

            <div className="card border-0 shadow-sm tester-profile-card">

              <div className="card-header bg-white border-0">

                <h5 className="fw-bold mb-1">
                  Bank Details
                </h5>

                <p className="text-muted small mb-0">
                  Used for receiving campaign
                  payments.
                </p>

              </div>

              <div className="card-body">

                {messageSection === "bank" && message && (
                  <div className="alert alert-success" role="status">
                    <i className="bi bi-check-circle me-2"></i>
                    {message}
                  </div>
                )}

                {messageSection === "bank" && error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}


                {profile?.bankDetails
                  ?.accountNumberLast4 && (

                  <div className="alert alert-light border">

                    Current account ending in{" "}

                    <strong>
                      ****
                      {
                        profile
                          .bankDetails
                          .accountNumberLast4
                      }
                    </strong>

                    {profile.bankDetails
                      .isVerified && (
                      <span className="badge bg-success ms-2">
                        Verified
                      </span>
                    )}

                  </div>

                )}

                <div className="row g-3">

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Account Holder Name
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      disabled={!editingBank}
                      value={
                        accountHolderName
                      }
                      onChange={(event) =>
                        setAccountHolderName(
                          event.target.value
                        )
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Bank Name
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      disabled={!editingBank}
                      value={
                        bankName
                      }
                      onChange={(event) =>
                        setBankName(
                          event.target.value
                        )
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Account Number
                    </label>

                    <div className="input-group">
                      <input
                        type={showAccountNumber ? "text" : "password"}
                        inputMode="numeric"
                        className="form-control"
                        disabled={!editingBank}
                        value={accountNumber}
                        onChange={(event) =>
                          setAccountNumber(event.target.value)
                        }
                        placeholder="Enter account number"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={!editingBank}
                        onClick={() =>
                          setShowAccountNumber((current) => !current)
                        }
                        aria-label={
                          showAccountNumber
                            ? "Hide account number"
                            : "Show account number"
                        }
                        aria-pressed={showAccountNumber}
                        title={
                          showAccountNumber
                            ? "Hide account number"
                            : "Show account number"
                        }
                      >
                        <i
                          className={`bi ${
                            showAccountNumber ? "bi-eye-slash" : "bi-eye"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    <div className="form-text">
                      Re-enter the account
                      number when updating bank
                      details.
                    </div>

                  </div>

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      IFSC Code
                    </label>

                    <input
                      type="text"
                      className="form-control text-uppercase"
                      disabled={!editingBank}
                      value={
                        ifscCode
                      }
                      onChange={(event) =>
                        setIfscCode(
                          event.target.value
                            .toUpperCase()
                        )
                      }
                      placeholder="SBIN0001234"
                    />

                  </div>

                  <div className="col-12">

                    <label className="form-label fw-semibold">
                      UPI ID
                      <span className="text-muted fw-normal">
                        {" "}
                        (optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      disabled={!editingBank}
                      value={upiId}
                      onChange={(event) =>
                        setUpiId(
                          event.target.value
                        )
                      }
                      placeholder="name@upi"
                    />

                  </div>

                </div>

              </div>

              <div className="card-footer bg-white border-0">
                {editingBank ? (
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={bankSaving}
                    >
                      {bankSaving ? "Saving..." : "Save Bank Details"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={bankSaving}
                      onClick={cancelBankEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setEditingBank(true)}
                  >
                    <i className="bi bi-pencil-square me-2"></i>
                    Edit
                  </button>
                )}
              </div>

            </div>

          </form>

        </div>

        {/* ====================================================
            RIGHT SUMMARY
        ==================================================== */}

        <div className="col-xl-4 order-1 order-md-2">

          <div className="card border-0 shadow-sm tester-profile-summary">

            <div className="card-body">

              <div className="tester-profile-avatar">

                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={
                      profile?.fullName ??
                      "Tester"
                    }
                  />
                ) : (
                  <i className="bi bi-person"></i>
                )}

              </div>

              <h5 className="fw-bold mt-3 mb-1">
                {
                  profile?.fullName ??
                  "Tester"
                }
              </h5>

              <div className="text-muted small mb-3">
                {
                  profile?.user?.mobile
                }
              </div>

              <div className="tester-profile-meta">

                <div>
                  <i className="bi bi-geo-alt"></i>

                  <span>
                    {
                      profile?.city ??
                      "-"
                    }
                    {profile?.state
                      ? `, ${profile.state}`
                      : ""}
                  </span>
                </div>

                <div>
                  <i className="bi bi-person-check"></i>

                  <span>
                    Status:{" "}
                    {
                      profile?.approvalStatus ??
                      "-"
                    }
                  </span>
                </div>

                <div>
                  <i className="bi bi-heart"></i>

                  <span>
                    {
                      selectedInterestIds.length
                    }{" "}
                    interests selected
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              COMMUNITY & CONTACT
          ================================================== */}

          {/* <div className="card border-0 shadow-sm tester-profile-card mt-4">

            <div className="card-body">

              <h5 className="fw-bold mb-3">
                WhatsApp Community
              </h5>

              <a
                href="https://chat.whatsapp.com/JLDLEwZWJTPJKhPl5XzWQD"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success w-100"
              >
                <i className="bi bi-whatsapp me-2"></i>
                WhatsApp Community
              </a>

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">
                Help / Contact Us:
              </h5>

              <div className="d-flex flex-column gap-3">

                <div>
                  <i className="bi bi-whatsapp text-success me-2"></i>
                  <span className="text-muted me-2">
                    WhatsApp number -
                  </span>
                  <a
                    href="https://wa.me/918341675736"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none fw-semibold"
                  >
                    8341675736
                  </a>
                </div>

                <div>
                  <i className="bi bi-telephone text-primary me-2"></i>
                  <span className="text-muted me-2">
                    Call us -
                  </span>
                  <a
                    href="tel:+918341675736"
                    className="text-decoration-none fw-semibold"
                  >
                    8341675736
                  </a>
                </div>

              </div>

            </div>

          </div> */}

        </div>

      </div>

    </div>
  );
}


// ============================================================
// READ ONLY FIELD
// ============================================================

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="col-md-6">

      <label className="form-label fw-semibold">
        {label}
      </label>

      <input
        type="text"
        className="form-control bg-light"
        value={value ?? ""}
        readOnly
      />

    </div>
  );
}