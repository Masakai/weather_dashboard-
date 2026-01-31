import Foundation

struct APIClient {
    enum APIError: Error {
        case invalidURL
        case invalidResponse
        case statusCode(Int)
    }

    func fetch<T: Decodable>(_ urlString: String) async throws -> T {
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard 200..<300 ~= http.statusCode else {
            throw APIError.statusCode(http.statusCode)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func fetch<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard 200..<300 ~= http.statusCode else {
            throw APIError.statusCode(http.statusCode)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func fetchText(_ urlString: String) async throws -> String {
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard 200..<300 ~= http.statusCode else {
            throw APIError.statusCode(http.statusCode)
        }
        return String(data: data, encoding: .utf8) ?? ""
    }
}
