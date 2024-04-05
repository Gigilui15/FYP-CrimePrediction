import pandas as pd
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler

# Load the training dataset
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set.csv')

# Separate features and target variable
X_train = train_data.drop(columns=['total_crimes'])
y_train = train_data['total_crimes']

# Scale the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# Initialize the SVM regressor
svm_regressor = SVR(kernel='linear')

# Train the model
svm_regressor.fit(X_train_scaled, y_train)

# Load the test dataset
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\test_set.csv')

# Separate features and target variable
X_test = test_data.drop(columns=['total_crimes'])
y_test = test_data['total_crimes']

# Scale the test features
X_test_scaled = scaler.transform(X_test)

# Predict on the test data
y_pred = svm_regressor.predict(X_test_scaled)

# Calculate Mean Squared Error (MSE) as an evaluation metric
mse = mean_squared_error(y_test, y_pred)
print("Mean Squared Error (SVM):", mse)
