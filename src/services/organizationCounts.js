import api from "./api";

const extractList = (response, key) => {
  const payload = response?.data?.data ?? response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];

  return [];
};

export const fetchOrganizationCounts = async (organizationId) => {
  const [membersResult, teamsResult] = await Promise.allSettled([
    api.get(`/api/organizations/${encodeURIComponent(organizationId)}/members`),
    api.get(`/api/organizations/${encodeURIComponent(organizationId)}/teams`),
  ]);

  return {
    membersCount:
      membersResult.status === "fulfilled"
        ? extractList(membersResult.value, "members").length
        : null,
    teamsCount:
      teamsResult.status === "fulfilled"
        ? extractList(teamsResult.value, "teams").length
        : null,
  };
};
