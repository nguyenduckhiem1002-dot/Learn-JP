import SwiftUI

struct PracticeView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = PracticeViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                if viewModel.isLoading {
                    ProgressView("Đang tải...")
                } else if let card = viewModel.currentCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(card.prompt)
                            .font(.title2)
                        if let reading = card.reading, !reading.isEmpty {
                            Text("Reading: \(reading)")
                                .foregroundStyle(.secondary)
                        }
                        Divider()
                        Text(card.answer)
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.thinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    HStack {
                        Button("Sai") {
                            Task { await submit(correct: false) }
                        }
                        .buttonStyle(.bordered)

                        Button("Đúng") {
                            Task { await submit(correct: true) }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    ContentUnavailableView("Hết thẻ", systemImage: "checkmark.circle", description: Text("Bạn đã hoàn thành lượt học hiện tại."))
                }

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .font(.footnote)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("Luyện JP")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Tải lại") {
                        Task { await reload() }
                    }
                }
            }
            .task {
                if viewModel.currentCard == nil && !viewModel.isLoading {
                    await reload()
                }
            }
        }
    }

    private func reload() async {
        guard let baseURL = sessionStore.baseURL else {
            viewModel.errorMessage = "Base URL không hợp lệ."
            return
        }
        let token = sessionStore.authToken.isEmpty ? nil : sessionStore.authToken
        await viewModel.loadCards(baseURL: baseURL, token: token)
    }

    private func submit(correct: Bool) async {
        guard let baseURL = sessionStore.baseURL else { return }
        let token = sessionStore.authToken.isEmpty ? nil : sessionStore.authToken
        await viewModel.submitAnswer(correct: correct, baseURL: baseURL, token: token)
    }
}
