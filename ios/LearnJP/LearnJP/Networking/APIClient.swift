import Foundation

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case unauthorized
}

final class APIClient {
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init() {
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        encoder = JSONEncoder()
    }

    func fetchCards(baseURL: URL, token: String?) async throws -> [Card] {
        var request = URLRequest(url: baseURL.appending(path: "api/cards"))
        request.httpMethod = "GET"
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200:
            return try decoder.decode([Card].self, from: data)
        case 401:
            throw APIError.unauthorized
        default:
            throw APIError.invalidResponse
        }
    }

    func submitProgress(baseURL: URL, token: String?, payload: ProgressPayload) async throws {
        var request = URLRequest(url: baseURL.appending(path: "api/progress"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try encoder.encode(payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            if httpResponse.statusCode == 401 {
                throw APIError.unauthorized
            }
            throw APIError.invalidResponse
        }
    }
}
