import pandas as pd
from sklearn.model_selection import train_test_split, learning_curve
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import numpy as np

# Load training data
train_data = pd.read_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\train_set.csv')

# Remove the 'year' column from training data
train_data.drop('year', axis=1, inplace=True)

# Define features and target variable for training data
X_train = train_data[['month', 'area', 'agg_id']]  # Adjust column names if necessary
y_train = train_data['total_crimes']

# Feature scaling for training data
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# Initialize and train the SVR model
svr = SVR(kernel='rbf', C=128657, epsilon=1, gamma='auto')
svr.fit(X_train_scaled, y_train)

# Load test data
test_data = pd.read_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\test_set.csv')

# Remove the 'year' column from test data
test_data.drop('year', axis=1, inplace=True)

# Define features for test data
X_test = test_data[['month', 'area', 'agg_id']]  # Ensure the column names match those of the training set
y_test = test_data['total_crimes']  # Actual crime numbers

# Feature scaling for test data using the same scaler as the training data
X_test_scaled = scaler.transform(X_test)

# Predict on the test data
y_pred = svr.predict(X_test_scaled)

# Calculate evaluation metrics for testing set
mse_test = mean_squared_error(y_test, y_pred)
rmse_test = np.sqrt(mse_test)
mae_test = mean_absolute_error(y_test, y_pred)
r2_test = r2_score(y_test, y_pred)

# Print testing set metrics
print("\nTesting Set Metrics:")
print("Mean Squared Error (MSE):", mse_test)
print("Root Mean Squared Error (RMSE):", rmse_test)
print("Mean Absolute Error (MAE):", mae_test)
print("R-squared (R2):", r2_test)

# Plotting Actual Vs Predicted Values
plt.figure(figsize=(8, 6))
plt.scatter(y_test, y_pred, color='blue')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'k--', lw=4)
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('True vs Predicted Values')
plt.show()

# Plotting Residuals
residuals = y_test - y_pred
plt.figure(figsize=(8, 6))
plt.scatter(y_test, residuals, color='blue')
plt.xlabel('True Values')
plt.ylabel('Residuals')
plt.title('Residual Plot')
plt.axhline(y=0, color='r', linestyle='--')
plt.show()

# Plotting Histogram of Residuals (Distribution purposes)
plt.figure(figsize=(8, 6))
plt.hist(residuals, bins=30, color='blue', edgecolor='black')
plt.xlabel('Residuals')
plt.ylabel('Frequency')
plt.title('Histogram of Residuals')
plt.show()

# Plotting Learning Curve
train_sizes, train_scores, test_scores = learning_curve(svr, X_train_scaled, y_train, cv=5, scoring='neg_mean_squared_error', n_jobs=-1, train_sizes=np.linspace(0.1, 1.0, 5))

train_scores_mean = -train_scores.mean(axis=1)
test_scores_mean = -test_scores.mean(axis=1)

plt.figure(figsize=(8, 6))
plt.plot(train_sizes, train_scores_mean, 'o-', color='r', label='Training Error')
plt.plot(train_sizes, test_scores_mean, 'o-', color='g', label='Validation Error')
plt.xlabel('Training examples')
plt.ylabel('Mean Squared Error')
plt.title('Learning Curve')
plt.legend()
plt.show()

# Optionally print the test data with predictions for visual comparison
test_data['predicted_crimes'] = y_pred
print(test_data)
