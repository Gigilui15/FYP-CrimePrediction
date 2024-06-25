import pandas as pd
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import learning_curve
from sklearn.ensemble import RandomForestRegressor

# Loading the training dataset
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\train_set.csv')

# Separating the features and target variable for training set
X_train = train_data.drop(columns=['total_crimes'])
y_train = train_data['total_crimes']

# Training the model with K = 5
best_knn_regressor = KNeighborsRegressor(n_neighbors=2, metric='cosine')
best_knn_regressor.fit(X_train, y_train)

# Predicting on the training data
y_train_pred = best_knn_regressor.predict(X_train)

# Loading the test dataset
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\test_set.csv')

# Separating the features and target variable for testing set
X_test = test_data.drop(columns=['total_crimes'])
y_test = test_data['total_crimes']

# Predicting on the test data
y_pred = best_knn_regressor.predict(X_test)

# Adding predictions as a new column in the test dataset
test_data['knn_predictions'] = y_pred

# Printing the test dataset with the predictions
print("\n Predictions:\n",test_data.head() ,"\n")  

# Saving the predictions as a CSV
test_data.to_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\Model Predictions\\KNN_predictions.csv', index=False)

# Calculating MSE for testing set
mse = mean_squared_error(y_test, y_pred)
print("\nTesting Set Metrics:")
print("Mean Squared Error (MSE):", mse)

# Calculating RMSE for testing set
rmse = np.sqrt(mse)
print("Root Mean Squared Error (RMSE):", rmse)

# Calculating MAE for testing set
mae = mean_absolute_error(y_test, y_pred)
print("Mean Absolute Error (MAE):", mae)

# Calculating R2 for testing set
r2 = r2_score(y_test, y_pred)
print("R-squared (R2):", r2)

# Calculating R for testing set
corr_coef = np.corrcoef(y_test, y_pred)[0, 1]
print("Correlation Coefficient (R):", corr_coef)

# Plotting Actual vs Predicted Values (Test Set)
plt.figure(figsize=(10, 5))
plt.scatter(y_test, y_pred, color='blue', alpha=0.5, label='Actual vs Predicted Values')
plt.plot([min(y_test), max(y_test)], [min(y_test), max(y_test)], linestyle='--', color='red', label='Perfect Prediction Line')
plt.title('Actual vs Predicted Values (Test Set)')
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.grid(True)
plt.legend()
plt.show()

# Residual Plot (Test Set)
plt.figure(figsize=(10, 5))
residuals = y_test - y_pred
plt.scatter(y_pred, residuals, color='blue', alpha=0.5)
plt.axhline(y=0, color='red', linestyle='--')
plt.title('Residual Plot')
plt.xlabel('Predicted Values')
plt.ylabel('Residuals')
plt.grid(True)
plt.show()

# Calculating residuals (Test Set)
residuals = y_test - y_pred

# Plotting the distribution of residuals (Test Set)
plt.figure(figsize=(10, 5))
plt.hist(residuals, bins=20, color='blue', alpha=0.5)
plt.title('Distribution of Residuals')
plt.xlabel('Residuals')
plt.ylabel('Frequency')
plt.grid(True)
plt.show()

# Learning Curve (Test Set)
train_sizes, train_scores, test_scores = learning_curve(best_knn_regressor, X_train, y_train, cv=5, scoring='neg_mean_squared_error', n_jobs=-1)
train_scores_mean = -np.mean(train_scores, axis=1)
test_scores_mean = -np.mean(test_scores, axis=1)

# Plotting the Learning Curve (Test Set)
plt.figure(figsize=(10, 5))
plt.plot(train_sizes, train_scores_mean, 'o-', color="r", label="Training error")
plt.plot(train_sizes, test_scores_mean, 'o-', color="g", label="Cross-validation error")
plt.title("Learning Curve")
plt.xlabel("Training examples")
plt.ylabel("Error")
plt.legend(loc="best")
plt.grid(True)
plt.show()

# Feature Importance Plot 
rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
rf_regressor.fit(X_train, y_train)

# Getting feature importances
feature_importances = rf_regressor.feature_importances_

# Getting feature names
feature_names = X_train.columns

# Sorting feature importances in descending order
indices = feature_importances.argsort()[::-1]

# Plotting Feature Importances 
plt.figure(figsize=(10, 5))
plt.title("Feature Importances")
plt.bar(range(X_train.shape[1]), feature_importances[indices], align="center")
plt.xticks(range(X_train.shape[1]), feature_names[indices], rotation=90)
plt.xlabel("Features")
plt.ylabel("Importance")
plt.tight_layout()
plt.show()