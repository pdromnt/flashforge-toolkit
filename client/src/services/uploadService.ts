const getApiUrl = (endpoint: string) => {
    if (import.meta.env.MODE === 'development') {
        return `http://localhost:3000${endpoint}`;
    }
    return endpoint;
};

export const uploadFile = async (
    file: File,
    onProgress: (pct: number) => void,
    onSuccess: () => void,
    onError: (error: string) => void
): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const apiUrl = getApiUrl("/upload");
        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.body) {
            throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            chunk.split("\n").forEach((line) => {
                if (line.startsWith("data:")) {
                    try {
                        const payload = JSON.parse(line.replace("data: ", ""));
                        if (payload.pct) {
                            onProgress(parseFloat(payload.pct));
                        }
                        if (payload.done) {
                            onSuccess();
                        }
                        if (payload.error) {
                            onError(payload.error);
                        }
                    } catch (e) {
                        console.error("Error parsing JSON", e);
                    }
                }
            });
        }
    } catch (err: any) {
        onError(err.message);
    }
};
